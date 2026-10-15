"""Aggregated power sensors built from the configured entities."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import PERCENTAGE, STATE_UNAVAILABLE, STATE_UNKNOWN, UnitOfPower
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    CONF_BATTERY_COMBINED,
    CONF_BATTERY_IN,
    CONF_BATTERY_OUT,
    CONF_FEED_IN,
    CONF_GRID_COMBINED,
    CONF_INVERT_BATTERY,
    CONF_INVERT_GRID,
    CONF_PRODUCTION,
    DOMAIN,
)


@dataclass(frozen=True, kw_only=True)
class PVDescription(SensorEntityDescription):
    value_fn: Callable[[dict[str, float]], float | None]


def _self_consumption(v: dict[str, float]) -> float | None:
    if v["production"] <= 0:
        return None
    exported = min(v["feed_in"], v["production"])
    return round(100 * (v["production"] - exported) / v["production"], 1)


_W = dict(
    native_unit_of_measurement=UnitOfPower.WATT,
    device_class=SensorDeviceClass.POWER,
    state_class=SensorStateClass.MEASUREMENT,
)


def _w(key: str, **kw: Any) -> PVDescription:
    return PVDescription(key=key, translation_key=key, value_fn=lambda v: round(v[key]), **_W, **kw)


DESCRIPTIONS = (
    _w("production"),
    _w("feed_in"),
    _w("battery_in"),
    _w("battery_out"),
    PVDescription(
        key="self_consumption", translation_key="self_consumption",
        value_fn=_self_consumption,
        native_unit_of_measurement=PERCENTAGE, state_class=SensorStateClass.MEASUREMENT,
    ),
)


def _ids(cfg: dict[str, Any], key: str) -> list[str]:
    v = cfg.get(key) or []
    return [v] if isinstance(v, str) else list(v)


def _watts(hass: HomeAssistant, entity_id: str) -> float | None:
    st = hass.states.get(entity_id)
    if st is None or st.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return None
    try:
        val = float(st.state)
    except ValueError:
        return None
    return val * {"kW": 1000, "MW": 1e6}.get(st.attributes.get("unit_of_measurement"), 1)


def _sum(hass: HomeAssistant, ids: list[str]) -> float | None:
    vals = [_watts(hass, i) for i in ids]
    return None if None in vals else sum(vals)  # type: ignore[arg-type]


def _split(hass: HomeAssistant, ids: list[str], invert: bool) -> tuple[float, float] | None:
    """Combined sensors: (positive part, negative part as positive number)."""
    pos = neg = 0.0
    for i in ids:
        w = _watts(hass, i)
        if w is None:
            return None
        w = -w if invert else w
        pos += max(w, 0.0)
        neg += max(-w, 0.0)
    return pos, neg


def compute_storage(hass: HomeAssistant, data: dict[str, Any]) -> tuple[float, float] | None:
    """(charge W, discharge W) of one storage, or None if a source is unavailable.

    Combined sensors, default sign: + = charging, - = discharging.
    """
    b_in = _sum(hass, _ids(data, CONF_BATTERY_IN))
    b_out = _sum(hass, _ids(data, CONF_BATTERY_OUT))
    bat = _split(hass, _ids(data, CONF_BATTERY_COMBINED), bool(data.get(CONF_INVERT_BATTERY)))
    if None in (b_in, b_out, bat):
        return None
    return max(b_in, 0.0) + bat[0], max(b_out, 0.0) + bat[1]


def compute(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, float] | None:
    """Totals in W (production, feed_in, battery_in, battery_out) or None.

    Combined grid sensor, default sign: + = import (- = feed-in); the invert
    switch flips it. Storage totals sum over all storage subentries.
    """
    cfg = entry.data
    prod = _sum(hass, _ids(cfg, CONF_PRODUCTION))
    feed = _sum(hass, _ids(cfg, CONF_FEED_IN))
    grid = _split(hass, _ids(cfg, CONF_GRID_COMBINED), bool(cfg.get(CONF_INVERT_GRID)))
    if None in (prod, feed, grid):
        return None
    b_in = b_out = 0.0
    for sub in entry.subentries.values():
        r = compute_storage(hass, dict(sub.data))
        if r is None:
            return None
        b_in += r[0]
        b_out += r[1]
    return {
        "production": max(prod, 0.0),
        "feed_in": max(feed, 0.0) + grid[1],
        "battery_in": b_in,
        "battery_out": b_out,
    }


def _source_ids(entry: ConfigEntry) -> list[str]:
    keys = (CONF_PRODUCTION, CONF_FEED_IN, CONF_GRID_COMBINED)
    ids = [i for k in keys for i in _ids(entry.data, k)]
    for sub in entry.subentries.values():
        ids += [i for k in (CONF_BATTERY_IN, CONF_BATTERY_OUT, CONF_BATTERY_COMBINED) for i in _ids(sub.data, k)]
    return ids


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    has_storage = bool(entry.subentries)
    async_add_entities(
        PVSensor(entry, d)
        for d in DESCRIPTIONS
        if has_storage or not d.key.startswith("battery")
    )
    for sub in entry.subentries.values():
        async_add_entities(
            [StorageSensor(entry, sub, "charge"), StorageSensor(entry, sub, "discharge")],
            config_subentry_id=sub.subentry_id,
        )


class PVSensor(SensorEntity):
    """Totals across all configured sources."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    entity_description: PVDescription

    def __init__(self, entry: ConfigEntry, description: PVDescription) -> None:
        self._entry = entry
        self.entity_description = description
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)}, name="PV Assistant"
        )

    async def async_added_to_hass(self) -> None:
        @callback
        def _changed(_: Event) -> None:
            self._recalc()
            self.async_write_ha_state()

        self.async_on_remove(
            async_track_state_change_event(self.hass, _source_ids(self._entry), _changed)
        )
        self._recalc()

    def _recalc(self) -> None:
        values = compute(self.hass, self._entry)
        self._attr_native_value = (
            None if values is None else self.entity_description.value_fn(values)
        )


class StorageSensor(SensorEntity):
    """Charge / discharge power of a single storage (its own device)."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_native_unit_of_measurement = UnitOfPower.WATT
    _attr_device_class = SensorDeviceClass.POWER
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, entry: ConfigEntry, sub: ConfigSubentry, kind: str) -> None:
        self._sub = sub
        self._kind = kind
        self._attr_translation_key = f"storage_{kind}"
        self._attr_unique_id = f"{sub.subentry_id}_{kind}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, sub.subentry_id)},
            name=sub.title,
            via_device=(DOMAIN, entry.entry_id),
        )

    async def async_added_to_hass(self) -> None:
        data = dict(self._sub.data)
        ids = [i for k in (CONF_BATTERY_IN, CONF_BATTERY_OUT, CONF_BATTERY_COMBINED) for i in _ids(data, k)]

        @callback
        def _changed(_: Event) -> None:
            self._recalc()
            self.async_write_ha_state()

        self.async_on_remove(async_track_state_change_event(self.hass, ids, _changed))
        self._recalc()

    def _recalc(self) -> None:
        r = compute_storage(self.hass, dict(self._sub.data))
        self._attr_native_value = (
            None if r is None else round(r[0] if self._kind == "charge" else r[1])
        )
