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
from homeassistant.config_entries import ConfigEntry
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


def compute(hass: HomeAssistant, cfg: dict[str, Any]) -> dict[str, float] | None:
    """Return production/feed_in/battery_in/battery_out in W, or None if a source is unavailable.

    Combined sensors, default sign: grid + = import (- = feed-in),
    battery + = charging (- = discharging). The invert switches flip that.
    """
    prod = _sum(hass, _ids(cfg, CONF_PRODUCTION))
    feed = _sum(hass, _ids(cfg, CONF_FEED_IN))
    b_in = _sum(hass, _ids(cfg, CONF_BATTERY_IN))
    b_out = _sum(hass, _ids(cfg, CONF_BATTERY_OUT))
    grid = _split(hass, _ids(cfg, CONF_GRID_COMBINED), bool(cfg.get(CONF_INVERT_GRID)))
    bat = _split(hass, _ids(cfg, CONF_BATTERY_COMBINED), bool(cfg.get(CONF_INVERT_BATTERY)))
    if None in (prod, feed, b_in, b_out, grid, bat):
        return None
    return {
        "production": max(prod, 0.0),
        "feed_in": max(feed, 0.0) + grid[1],
        "battery_in": max(b_in, 0.0) + bat[0],
        "battery_out": max(b_out, 0.0) + bat[1],
    }


_BATTERY_KEYS = (CONF_BATTERY_IN, CONF_BATTERY_OUT, CONF_BATTERY_COMBINED)
_ALL_SOURCES = (
    CONF_PRODUCTION, CONF_FEED_IN, CONF_GRID_COMBINED,
    CONF_BATTERY_IN, CONF_BATTERY_OUT, CONF_BATTERY_COMBINED,
)


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    cfg = dict(entry.data)
    has_battery = any(_ids(cfg, k) for k in _BATTERY_KEYS)
    async_add_entities(
        PVSensor(entry, cfg, d)
        for d in DESCRIPTIONS
        if has_battery or not d.key.startswith("battery")
    )


class PVSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    entity_description: PVDescription

    def __init__(self, entry: ConfigEntry, cfg: dict[str, Any], description: PVDescription) -> None:
        self.entity_description = description
        self._cfg = cfg
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)}, name="PV Assistant"
        )

    async def async_added_to_hass(self) -> None:
        ids = [i for s in _ALL_SOURCES for i in _ids(self._cfg, s)]

        @callback
        def _changed(_: Event) -> None:
            self._recalc()
            self.async_write_ha_state()

        self.async_on_remove(async_track_state_change_event(self.hass, ids, _changed))
        self._recalc()

    def _recalc(self) -> None:
        values = compute(self.hass, self._cfg)
        self._attr_native_value = (
            None if values is None else self.entity_description.value_fn(values)
        )
