"""Sensors that look ahead: PV surplus now, when the storage runs empty, expected feed-in and best window of tomorrow.

The expected feed-in and the best window need a short history that the integration collects itself (stored over restarts):
the production and feed-in of the last days and the production of every hour of the last days.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfEnergy, UnitOfPower
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    CONF_ABS_STORAGE_POWER,
    CONF_BATTERY_SOC,
    CONF_FEED_IN_ENERGY,
    CONF_FEED_IN_POWER,
    CONF_FORECAST_TOMORROW,
    CONF_INVERT_FEED_IN_POWER,
    CONF_INVERT_STORAGE_COMBINED_POWER,
    CONF_PRODUCTION_ENERGY,
    CONF_STORAGE_COMBINED_POWER,
    CONF_STORAGE_IN_POWER,
    CONF_STORAGE_OUT_POWER,
    DOMAIN,
    HISTORY_STORE_KEY,
    SIGNAL_HISTORY,
    SIGNAL_SETTINGS,
)
from .helpers import as_list, kwh, settings, watts

WINDOW_HOURS = 3  # length of the best window
KEEP_DAYS = 21  # days of history that are kept
USE_DAYS = 14  # days that the expected feed-in and the profile are based on
MIN_PROFILE_DAYS = 3  # fewer days with production do not make a profile
MIN_DISCHARGE_W = 50.0  # below this the storage is not discharging


# ---------------------------------------------------------------- pure calculations (tested without Home Assistant)


def hourly_profile(hours: dict[str, list[float | None]], today: str) -> tuple[list[float], int] | None:
    """Share of the daily production per hour of the day from the last days, and the number of days it is based on.

    hours maps a date to the 24 energies of its hours (None = unknown). Only complete past days with production count.
    """
    days = [d for d in sorted(hours, reverse=True) if d < today][:USE_DAYS]
    usable = [hours[d] for d in days if sum(v for v in hours[d] if v) > 0]
    if len(usable) < MIN_PROFILE_DAYS:
        return None
    mean = [sum((day[h] or 0.0) for day in usable) / len(usable) for h in range(24)]
    total = sum(mean)
    return [m / total for m in mean], len(usable)


def best_window(profile: list[float], forecast: float, length: int = WINDOW_HOURS) -> tuple[int, float]:
    """First hour of the window with the most energy and that energy, for a day with the given forecast (kWh)."""
    best_start, best_share = 0, -1.0
    for start in range(0, 24 - length + 1):
        share = sum(profile[start : start + length])
        if share > best_share:
            best_start, best_share = start, share
    return best_start, best_share * forecast


def feed_in_share(days: dict[str, dict[str, float]], today: str) -> tuple[float, int] | None:
    """Share of the production that was fed in over the last days, and the number of days."""
    recent = [days[d] for d in sorted(days, reverse=True) if d < today][:USE_DAYS]
    recent = [d for d in recent if (d.get("production") or 0) > 0 and d.get("feed_in") is not None]
    produced = sum(d["production"] for d in recent)
    if not recent or produced <= 0:
        return None
    return min(max(sum(d["feed_in"] for d in recent) / produced, 0.0), 1.0), len(recent)


# ---------------------------------------------------------------- the collected history


class History:
    """Production and feed-in per day and production per hour of the last days (stored)."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self._hass = hass
        self._entry = entry
        self._store = Store(hass, 1, HISTORY_STORE_KEY)
        self.days: dict[str, dict[str, float]] = {}
        self.hours: dict[str, list[float | None]] = {}
        self._last: dict[str, Any] = {}  # {"stamp": "YYYY-MM-DDTHH", "total": kWh} of the last hour mark

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.days = data.get("days", {})
        self.hours = data.get("hours", {})
        self._last = data.get("last", {})

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"days": self.days, "hours": self.hours, "last": self._last}, 30)

    def _prune(self) -> None:
        for book in (self.days, self.hours):
            for key in sorted(book)[:-KEEP_DAYS]:
                book.pop(key)

    def record_day(self, date: str, production: float | None, feed_in: float | None) -> None:
        """The finished day (called when the day counters roll over)."""
        if production is None:
            return
        self.days[date] = {"production": production, **({"feed_in": feed_in} if feed_in is not None else {})}
        self._prune()
        self._save()
        async_dispatcher_send_history(self._hass)

    def record_day_values(self, date: str) -> None:
        """Called by the day counters before they start a new day: store the values of the finished day."""
        from .calc import daily_values  # imported late: calc.py does not import this module, but sensor.py imports both

        values = daily_values(self._hass, self._entry)
        self.record_day(date, values["production_today"], values["feed_in_today"])

    def _total(self) -> float | None:
        counters = self._hass.data[DOMAIN]["daily"]
        values = [kwh(counters.resolve(i)) for i in as_list(self._entry.data.get(CONF_PRODUCTION_ENERGY))]
        return None if not values or None in values else float(sum(values))

    @callback
    def hour_mark(self, now: datetime) -> None:
        """At the start of every hour: the production of the hour that just ended."""
        total = self._total()
        now = dt_util.as_local(now)
        stamp = now.strftime("%Y-%m-%dT%H")
        previous = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H")
        if total is not None and self._last.get("stamp") == previous and self._last.get("total") is not None:
            before = float(self._last["total"])
            energy = total - before if total >= before else total  # a counter that fell was reset
            ended = now - timedelta(hours=1)
            row = self.hours.setdefault(ended.strftime("%Y-%m-%d"), [None] * 24)
            row[ended.hour] = round(max(energy, 0.0), 4)
            self._prune()
        self._last = {"stamp": stamp, "total": total}
        self._save()
        async_dispatcher_send_history(self._hass)


def async_dispatcher_send_history(hass: HomeAssistant) -> None:
    from homeassistant.helpers.dispatcher import async_dispatcher_send

    async_dispatcher_send(hass, SIGNAL_HISTORY)


# ---------------------------------------------------------------- sensors


class InsightSensor(SensorEntity):
    """Base: recomputes when a source, the settings or the history change."""

    _attr_should_poll = False
    _attr_has_entity_name = True

    def __init__(self, entry: ConfigEntry, key: str, sources: list[str]) -> None:
        self._entry = entry
        self._sources = sources
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, entry.entry_id)}, name="PV Assistant")

    def _compute(self) -> Any:
        raise NotImplementedError

    @callback
    def _update(self) -> None:
        value = self._compute()
        self._attr_native_value = round(value, 3) if isinstance(value, float) else value

    async def async_added_to_hass(self) -> None:
        if self._sources:
            self.async_on_remove(async_track_state_change_event(self.hass, self._sources, self._changed))
        for signal in (SIGNAL_SETTINGS, SIGNAL_HISTORY):
            self.async_on_remove(async_dispatcher_connect(self.hass, signal, self._changed))
        self._update()

    @callback
    def _changed(self, *_: Any) -> None:
        self._update()
        self.async_write_ha_state()


def storage_flows(hass: HomeAssistant, data: dict[str, Any]) -> tuple[float, float]:
    """(power into the storage, power from the storage) in W, like the energy flow of the panel."""
    absolute = bool(data.get(CONF_ABS_STORAGE_POWER))

    def total(key: str, fn) -> float:
        return float(sum(fn(v) for v in (watts(hass.states.get(i)) for i in as_list(data.get(key))) if v is not None))

    def side(v: float) -> float:
        return abs(v) if absolute else max(v, 0.0)

    sign = -1.0 if data.get(CONF_INVERT_STORAGE_COMBINED_POWER) else 1.0  # default: positive = from the storage
    into = total(CONF_STORAGE_IN_POWER, side) + total(CONF_STORAGE_COMBINED_POWER, lambda v: max(-v * sign, 0.0))
    out = total(CONF_STORAGE_OUT_POWER, side) + total(CONF_STORAGE_COMBINED_POWER, lambda v: max(v * sign, 0.0))
    return into, out


class PVSurplusSensor(InsightSensor):
    """Power that the house does not use: what is fed in plus what charges the storage."""

    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = UnitOfPower.WATT

    def __init__(self, entry: ConfigEntry) -> None:
        d = entry.data
        sources = as_list(d.get(CONF_FEED_IN_POWER)) + as_list(d.get(CONF_STORAGE_IN_POWER)) + as_list(d.get(CONF_STORAGE_COMBINED_POWER))
        super().__init__(entry, "pv_surplus_power", sources)

    def _compute(self) -> float | None:
        d = self._entry.data
        feed_ids = as_list(d.get(CONF_FEED_IN_POWER))
        feed = [watts(self.hass.states.get(i)) for i in feed_ids]
        if not feed_ids or None in feed:
            return None
        sign = -1.0 if d.get(CONF_INVERT_FEED_IN_POWER) else 1.0
        into, _out = storage_flows(self.hass, d)
        return sum(max(v * sign, 0.0) for v in feed) + into

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        into, _out = storage_flows(self.hass, self._entry.data)
        return {"charging_power": into}


class StorageEmptySensor(InsightSensor):
    """When the storage will be empty at the current discharge power (unknown while it does not discharge)."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, entry: ConfigEntry) -> None:
        d = entry.data
        sources = as_list(d.get(CONF_BATTERY_SOC)) + as_list(d.get(CONF_STORAGE_OUT_POWER)) + as_list(d.get(CONF_STORAGE_COMBINED_POWER))
        super().__init__(entry, "storage_empty_at", sources)

    def _usable_kwh(self) -> float | None:
        general = settings(self.hass).get("general", {})
        capacity = general.get("storage_capacity_kwh") or 0
        state = self.hass.states.get(as_list(self._entry.data.get(CONF_BATTERY_SOC))[0])
        try:
            level = float(state.state) if state else None
        except ValueError:
            level = None
        if not capacity or level is None:
            return None
        return capacity * max(level - (general.get("battery_min_soc") or 0), 0.0) / 100

    def _compute(self) -> datetime | None:
        usable = self._usable_kwh()
        _into, out = storage_flows(self.hass, self._entry.data)
        if usable is None or out < MIN_DISCHARGE_W:
            return None
        return dt_util.utcnow() + timedelta(hours=usable / (out / 1000))


class _TomorrowSensor(InsightSensor):
    def __init__(self, entry: ConfigEntry, key: str) -> None:
        super().__init__(entry, key, as_list(entry.data.get(CONF_FORECAST_TOMORROW)))

    def _forecast(self) -> float | None:
        values = [kwh(self.hass.states.get(i)) for i in as_list(self._entry.data.get(CONF_FORECAST_TOMORROW))]
        return None if not values or None in values else float(sum(values))

    def _history(self) -> History:
        return self.hass.data[DOMAIN]["history"]


class ExpectedFeedInSensor(_TomorrowSensor):
    """Feed-in expected for tomorrow: the forecast times the share of the production that was fed in on the last days."""

    _attr_device_class = SensorDeviceClass.ENERGY
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR

    def __init__(self, entry: ConfigEntry) -> None:
        super().__init__(entry, "expected_feed_in_tomorrow")
        self._days = 0

    def _compute(self) -> float | None:
        forecast = self._forecast()
        share = feed_in_share(self._history().days, dt_util.now().date().isoformat())
        self._days = share[1] if share else 0
        return None if forecast is None or share is None else forecast * share[0]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"days": self._days}


class BestWindowSensor(_TomorrowSensor):
    """Start of the best three hours of tomorrow (most production), from the forecast and the typical course of the day."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, entry: ConfigEntry) -> None:
        super().__init__(entry, "best_window_tomorrow")
        self._attrs: dict[str, Any] = {}

    def _compute(self) -> datetime | None:
        self._attrs = {}
        forecast = self._forecast()
        profile = hourly_profile(self._history().hours, dt_util.now().date().isoformat())
        if forecast is None or profile is None:
            return None
        start, energy = best_window(profile[0], forecast)
        tomorrow = dt_util.start_of_local_day() + timedelta(days=1, hours=start)
        self._attrs = {"end": tomorrow + timedelta(hours=WINDOW_HOURS), "energy": round(energy, 2), "days": profile[1]}
        return tomorrow

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return self._attrs


async def async_setup_insight(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    """Create the look-ahead sensors that the configured sensors allow and start collecting the history."""
    data = entry.data
    entities: list[InsightSensor] = []
    if data.get(CONF_FEED_IN_POWER):
        entities.append(PVSurplusSensor(entry))
    if data.get(CONF_BATTERY_SOC) and (data.get(CONF_STORAGE_OUT_POWER) or data.get(CONF_STORAGE_COMBINED_POWER)):
        entities.append(StorageEmptySensor(entry))
    if data.get(CONF_PRODUCTION_ENERGY) and data.get(CONF_FORECAST_TOMORROW):
        history = History(hass, entry)
        await history.async_load()
        hass.data[DOMAIN]["history"] = history
        hass.data[DOMAIN]["daily"].on_day_end = history.record_day_values
        entry.async_on_unload(async_track_time_change(hass, history.hour_mark, minute=0, second=10))
        entities.append(BestWindowSensor(entry))
        if data.get(CONF_FEED_IN_ENERGY):
            entities.append(ExpectedFeedInSensor(entry))
    if entities:
        async_add_entities(entities)

