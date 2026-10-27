"""Calculated sensors for automations and dashboards.

Power and effective power of the whole system and of every plant (inverter with its
strings), the production, feed-in, self-consumption, autarky and benefit of the current
day, the usable energy of the storage and the share of the forecast that was reached.
They use the filtered energy sensors where they exist. The values of the day are
counted from the value of the counters at midnight (kept over restarts).
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import PERCENTAGE, STATE_UNAVAILABLE, STATE_UNKNOWN, UnitOfEnergy, UnitOfPower
from homeassistant.core import HomeAssistant, State, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    CONF_BATTERY_SOC,
    CONF_FEED_IN_ENERGY,
    CONF_FORECAST_TODAY,
    CONF_GRID_IMPORT_ENERGY,
    CONF_HOUSE_ENERGY,
    CONF_INVERT_STORAGE_COMBINED,
    CONF_PRODUCTION_ENERGY,
    CONF_PRODUCTION_POWER,
    CONF_STORAGE_COMBINED_ENERGY,
    CONF_STORAGE_IN_ENERGY,
    CONF_STORAGE_OUT_ENERGY,
    DAILY_STORE_KEY,
    DOMAIN,
    SIGNAL_DAILY,
    SIGNAL_SETTINGS,
)
from .helpers import as_list, kwh, plant_label, plant_peak, plants, prices, settings, watts

NOISE = 0.01  # kWh; a counter that drops by less than this is rounding noise


def _known(state: State | None) -> bool:
    return state is not None and state.state not in (STATE_UNKNOWN, STATE_UNAVAILABLE)


class DayCounters:
    """Energy of the current day from the (total increasing) energy counters.

    The value of every counter at the start of the day is remembered and stored, so a restart
    keeps it. A counter that falls clearly below its start value was reset: it counts from 0.
    """

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self._hass = hass
        self._entry = entry
        self._store = Store(hass, 1, DAILY_STORE_KEY)
        self._date: str | None = None
        self._base: dict[str, float] = {}

    def resolve(self, source: str) -> State | None:
        """The filtered copy of a source sensor when it exists and has a value, otherwise the source itself."""
        from .sensor import filtered_unique_id  # imported late: sensor.py imports this module

        eid = er.async_get(self._hass).async_get_entity_id("sensor", DOMAIN, filtered_unique_id(self._entry.entry_id, source))
        state = self._hass.states.get(eid) if eid else None
        return state if _known(state) else self._hass.states.get(source)

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self._date = data.get("date")
        self._base = {key: float(value) for key, value in data.get("base", {}).items()}
        self._roll_if_needed()

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"date": self._date, "base": self._base}, 10)

    def _roll_if_needed(self) -> bool:
        today = dt_util.now().date().isoformat()
        if self._date == today:
            return False
        self._date = today
        for source in list(self._base):
            current = kwh(self.resolve(source))
            if current is None:
                self._base.pop(source)
            else:
                self._base[source] = current
        self._save()
        return True

    @callback
    def midnight(self, _now: Any) -> None:
        self._roll_if_needed()
        async_dispatcher_send(self._hass, SIGNAL_DAILY)

    def delta(self, source: str, signed: bool = False) -> float | None:
        """kWh since the start of the day (None while the counter has no value). signed: a net counter may fall."""
        self._roll_if_needed()
        current = kwh(self.resolve(source))
        if current is None:
            return None
        base = self._base.get(source)
        if base is None:
            base = self._base[source] = current
            self._save()
        elif current < base - NOISE and not signed:
            base = self._base[source] = 0.0
            self._save()
        return current - base


def daily_values(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, float | None]:
    """The values of the day for all daily sensors; None where a prerequisite is missing."""
    counters: DayCounters = hass.data[DOMAIN]["daily"]
    data = entry.data

    def total(key: str) -> float | None:
        ids = as_list(data.get(key))
        values = [counters.delta(i) for i in ids]
        return None if not ids or None in values else float(sum(values))

    prod, feed, imp, house = (total(k) for k in (CONF_PRODUCTION_ENERGY, CONF_FEED_IN_ENERGY, CONF_GRID_IMPORT_ENERGY, CONF_HOUSE_ENERGY))
    s_in, s_out = total(CONF_STORAGE_IN_ENERGY) or 0.0, total(CONF_STORAGE_OUT_ENERGY) or 0.0
    comb = as_list(data.get(CONF_STORAGE_COMBINED_ENERGY))
    nets = [counters.delta(i, signed=True) for i in comb]
    if comb and None not in nets:  # default: positive = from storage, negative = into storage
        net = float(sum(nets)) * (-1 if data.get(CONF_INVERT_STORAGE_COMBINED) else 1)
        s_in, s_out = s_in + max(-net, 0.0), s_out + max(net, 0.0)
    result: dict[str, float | None] = dict.fromkeys(
        ("production_today", "feed_in_today", "self_consumption_rate_today", "autarky_today", "savings_today", "feed_in_revenue_today", "benefit_today"))
    if prod is None:
        return result
    result["production_today"] = prod
    if feed is None:
        return result
    fed = min(max(feed, 0.0), prod)
    result["feed_in_today"] = feed
    used = prod - fed  # produced and not fed in: used in the house or stored
    if prod > 0:
        result["self_consumption_rate_today"] = used / prod * 100
    if imp is not None:
        consumption = house if house is not None else max(used - min(s_in, used), 0.0) + s_out + imp
        if consumption > 0:
            result["autarky_today"] = max(consumption - imp, 0.0) / consumption * 100
    price_import, price_feed = prices(hass, dict(data))
    if price_import:
        result["savings_today"] = used * price_import
    if price_feed:
        result["feed_in_revenue_today"] = fed * price_feed
    if price_import or price_feed:
        result["benefit_today"] = (used * (price_import or 0.0)) + (fed * (price_feed or 0.0))
    return result


class CalcSensor(SensorEntity):
    """Base of the calculated sensors: recomputes when a source, the settings or the day change."""

    _attr_should_poll = False
    _attr_has_entity_name = True

    def __init__(self, entry: ConfigEntry, key: str, sources: list[str]) -> None:
        self._entry = entry
        self._sources = sources
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, entry.entry_id)}, name="PV Assistant")

    def _compute(self) -> float | None:
        raise NotImplementedError

    @callback
    def _update(self) -> None:
        value = self._compute()
        self._attr_native_value = None if value is None else round(value, 3)

    async def async_added_to_hass(self) -> None:
        if self._sources:
            self.async_on_remove(async_track_state_change_event(self.hass, self._sources, self._changed))
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_SETTINGS, self._changed))
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_DAILY, self._changed))
        self._update()

    @callback
    def _changed(self, *_: Any) -> None:
        self._update()
        self.async_write_ha_state()


def _power_ids(entry: ConfigEntry) -> list[str]:
    return as_list(entry.data.get(CONF_PRODUCTION_POWER))


class PVPowerSensor(CalcSensor):
    """Power of the whole system: the sum of the production power sensors."""

    _attr_translation_key = "pv_power"
    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = UnitOfPower.WATT

    def __init__(self, entry: ConfigEntry) -> None:
        super().__init__(entry, "pv_power", _power_ids(entry))

    def _compute(self) -> float | None:
        values = [watts(self.hass.states.get(i)) for i in self._sources]
        known = [max(v, 0.0) for v in values if v is not None]
        return float(sum(known)) if known else None


class PVEffectivePowerSensor(CalcSensor):
    """Power of the whole system in percent of the peak (only the sensors that have a peak in the settings count)."""

    _attr_translation_key = "pv_effective_power"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = PERCENTAGE

    def __init__(self, entry: ConfigEntry) -> None:
        super().__init__(entry, "pv_effective_power", _power_ids(entry))

    def _compute(self) -> float | None:
        strings = settings(self.hass).get("strings", {})
        counted = [i for i in self._sources if (strings.get(i, {}).get("peak") or 0) > 0]
        values = [watts(self.hass.states.get(i)) for i in counted]
        if not counted or None in values:
            return None
        return sum(max(v, 0.0) for v in values) / sum(strings[i]["peak"] for i in counted) * 100


class _PlantSensor(CalcSensor):
    """A value of one plant (inverter with all its sensors). The plant is found again by its key whenever the settings change."""

    _suffix = ("", "")  # (German, English) text behind the plant name

    def __init__(self, entry: ConfigEntry, key: str, kind: str) -> None:
        super().__init__(entry, f"plant_{key}_{kind}", _power_ids(entry))
        self._key = key

    def _sensors(self) -> list[str] | None:
        return dict(plants(settings(self.hass), self._sources)).get(self._key)

    @property
    def available(self) -> bool:
        return self._sensors() is not None

    @property
    def name(self) -> str:
        sensors = self._sensors() or [self._key]
        german = self.hass.config.language.startswith("de")
        return f"{plant_label(self.hass, self._key, sensors)} {self._suffix[0 if german else 1]}"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        sensors = self._sensors() or []
        return {"sensors": sensors, "peak": plant_peak(settings(self.hass), sensors) if sensors else None}


class PlantPowerSensor(_PlantSensor):
    _suffix = ("Leistung", "power")
    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = UnitOfPower.WATT

    def __init__(self, entry: ConfigEntry, key: str) -> None:
        super().__init__(entry, key, "power")

    def _compute(self) -> float | None:
        values = [watts(self.hass.states.get(i)) for i in self._sensors() or []]
        known = [max(v, 0.0) for v in values if v is not None]
        return float(sum(known)) if known else None


class PlantEffectivePowerSensor(_PlantSensor):
    _suffix = ("effektive Leistung", "effective power")
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = PERCENTAGE

    def __init__(self, entry: ConfigEntry, key: str) -> None:
        super().__init__(entry, key, "effective_power")

    def _compute(self) -> float | None:
        sensors = self._sensors() or []
        peak = plant_peak(settings(self.hass), sensors)
        values = [watts(self.hass.states.get(i)) for i in sensors]
        if not peak or not values or None in values:
            return None
        return sum(max(v, 0.0) for v in values) / peak * 100


class StorageUsableSensor(CalcSensor):
    """Energy that can still be drawn from the storage: capacity × (level − minimum level), from the settings."""

    _attr_translation_key = "storage_usable"
    _attr_device_class = SensorDeviceClass.ENERGY_STORAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR

    def __init__(self, entry: ConfigEntry) -> None:
        super().__init__(entry, "storage_usable", as_list(entry.data.get(CONF_BATTERY_SOC)))

    def _compute(self) -> float | None:
        general = settings(self.hass).get("general", {})
        capacity = general.get("storage_capacity_kwh") or 0
        state = self.hass.states.get(self._sources[0])
        if not capacity or not _known(state):
            return None
        try:
            level = float(state.state)
        except ValueError:
            return None
        return capacity * max(level - (general.get("battery_min_soc") or 0), 0.0) / 100


class DailySensor(CalcSensor):
    """A value of the current day (see daily_values). Energy and money count from 0 at midnight."""

    def __init__(self, entry: ConfigEntry, key: str, kind: str) -> None:
        sources: list[str] = []
        for conf in (CONF_PRODUCTION_ENERGY, CONF_FEED_IN_ENERGY, CONF_GRID_IMPORT_ENERGY, CONF_HOUSE_ENERGY, CONF_STORAGE_IN_ENERGY, CONF_STORAGE_OUT_ENERGY, CONF_STORAGE_COMBINED_ENERGY):
            sources += as_list(entry.data.get(conf))
        super().__init__(entry, key, sources)
        self._attr_translation_key = key
        self._key = key
        if kind == "energy":
            self._attr_device_class = SensorDeviceClass.ENERGY
            self._attr_state_class = SensorStateClass.TOTAL
            self._attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
        elif kind == "money":
            self._attr_device_class = SensorDeviceClass.MONETARY
            self._attr_state_class = SensorStateClass.TOTAL
        else:
            self._attr_state_class = SensorStateClass.MEASUREMENT
            self._attr_native_unit_of_measurement = PERCENTAGE
        self._kind = kind

    @property
    def native_unit_of_measurement(self) -> str | None:
        return self.hass.config.currency if self._kind == "money" else self._attr_native_unit_of_measurement

    @property
    def last_reset(self):
        return dt_util.start_of_local_day() if self._kind in ("energy", "money") else None

    def _compute(self) -> float | None:
        return daily_values(self.hass, self._entry)[self._key]


class ForecastReachedSensor(CalcSensor):
    """Share of today's forecast that is already produced."""

    _attr_translation_key = "forecast_reached_today"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = PERCENTAGE

    def __init__(self, entry: ConfigEntry) -> None:
        sources = as_list(entry.data.get(CONF_FORECAST_TODAY)) + as_list(entry.data.get(CONF_PRODUCTION_ENERGY))
        super().__init__(entry, "forecast_reached_today", sources)

    def _compute(self) -> float | None:
        forecast = [kwh(self.hass.states.get(i)) for i in as_list(self._entry.data.get(CONF_FORECAST_TODAY))]
        produced = daily_values(self.hass, self._entry)["production_today"]
        if produced is None or None in forecast or sum(forecast) <= 0:
            return None
        return produced / sum(forecast) * 100


async def async_setup_calc(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    """Create the calculated sensors that the configured sensors allow."""
    data = entry.data
    counters = DayCounters(hass, entry)
    await counters.async_load()
    hass.data.setdefault(DOMAIN, {})["daily"] = counters
    entry.async_on_unload(async_track_time_change(hass, counters.midnight, hour=0, minute=0, second=5))

    entities: list[CalcSensor] = []
    if _power_ids(entry):
        entities += [PVPowerSensor(entry), PVEffectivePowerSensor(entry)]
    if data.get(CONF_PRODUCTION_ENERGY):
        entities.append(DailySensor(entry, "production_today", "energy"))
        if data.get(CONF_FEED_IN_ENERGY):
            entities += [
                DailySensor(entry, "feed_in_today", "energy"),
                DailySensor(entry, "self_consumption_rate_today", "percent"),
                DailySensor(entry, "savings_today", "money"),
                DailySensor(entry, "feed_in_revenue_today", "money"),
                DailySensor(entry, "benefit_today", "money"),
            ]
            if data.get(CONF_GRID_IMPORT_ENERGY):
                entities.append(DailySensor(entry, "autarky_today", "percent"))
        if data.get(CONF_FORECAST_TODAY):
            entities.append(ForecastReachedSensor(entry))
    if data.get(CONF_BATTERY_SOC):
        entities.append(StorageUsableSensor(entry))
    async_add_entities(entities)

    # plants come and go with the settings: new ones are added when the settings are saved
    known: set[str] = set()

    @callback
    def sync_plants(*_: Any) -> None:
        new: list[CalcSensor] = []
        for key, _sensors in plants(settings(hass), _power_ids(entry)):
            if key not in known:
                known.add(key)
                new += [PlantPowerSensor(entry, key), PlantEffectivePowerSensor(entry, key)]
        if new:
            async_add_entities(new)

    sync_plants()
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_SETTINGS, sync_plants))
