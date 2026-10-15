"""Calculated energy-flow sensors.

Sign conventions (after optional inversion): grid > 0 = import, grid < 0 = export;
battery > 0 = charging, battery < 0 = discharging.
"""

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
    CONF_BATTERY_POWER,
    CONF_GRID_POWER,
    CONF_INVERT_BATTERY,
    CONF_INVERT_GRID,
    CONF_PV_POWER,
    DOMAIN,
)


@dataclass(frozen=True, kw_only=True)
class PVDescription(SensorEntityDescription):
    value_fn: Callable[[float, float, float], float | None]


def _consumption(pv: float, grid: float, bat: float) -> float:
    return max(pv + grid - bat, 0.0)


def _autarky(pv: float, grid: float, bat: float) -> float | None:
    c = _consumption(pv, grid, bat)
    return None if c <= 0 else round(100 * (1 - min(max(grid, 0.0), c) / c), 1)


def _self_consumption(pv: float, grid: float, bat: float) -> float | None:
    if pv <= 0:
        return None
    return round(100 * (pv - min(max(-grid, 0.0), pv)) / pv, 1)


_W = dict(
    native_unit_of_measurement=UnitOfPower.WATT,
    device_class=SensorDeviceClass.POWER,
    state_class=SensorStateClass.MEASUREMENT,
)
_P = dict(native_unit_of_measurement=PERCENTAGE, state_class=SensorStateClass.MEASUREMENT)

DESCRIPTIONS = (
    PVDescription(key="consumption", translation_key="consumption", value_fn=lambda p, g, b: round(_consumption(p, g, b)), **_W),
    PVDescription(key="grid_import", translation_key="grid_import", value_fn=lambda p, g, b: round(max(g, 0.0)), **_W),
    PVDescription(key="grid_export", translation_key="grid_export", value_fn=lambda p, g, b: round(max(-g, 0.0)), **_W),
    PVDescription(key="autarky", translation_key="autarky", value_fn=_autarky, **_P),
    PVDescription(key="self_consumption", translation_key="self_consumption", value_fn=_self_consumption, **_P),
)


def _read(hass: HomeAssistant, entity_id: str | None) -> float | None:
    if not entity_id:
        return 0.0
    st = hass.states.get(entity_id)
    if st is None or st.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return None
    try:
        value = float(st.state)
    except ValueError:
        return None
    if st.attributes.get("unit_of_measurement") == "kW":
        value *= 1000
    return value


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    async_add_entities(PVSensor(entry, d) for d in DESCRIPTIONS)


class PVSensor(SensorEntity):
    """Sensor derived from the configured PV/grid/battery power entities."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    entity_description: PVDescription

    def __init__(self, entry: ConfigEntry, description: PVDescription) -> None:
        self.entity_description = description
        self._cfg: dict[str, Any] = dict(entry.data)
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)}, name="PV Assistant"
        )

    async def async_added_to_hass(self) -> None:
        sources = [
            self._cfg.get(k)
            for k in (CONF_PV_POWER, CONF_GRID_POWER, CONF_BATTERY_POWER)
            if self._cfg.get(k)
        ]

        @callback
        def _changed(_: Event) -> None:
            self._recalc()
            self.async_write_ha_state()

        self.async_on_remove(async_track_state_change_event(self.hass, sources, _changed))
        self._recalc()

    def _recalc(self) -> None:
        pv = _read(self.hass, self._cfg[CONF_PV_POWER])
        grid = _read(self.hass, self._cfg[CONF_GRID_POWER])
        bat = _read(self.hass, self._cfg.get(CONF_BATTERY_POWER))
        if None in (pv, grid, bat):
            self._attr_native_value = None
            return
        if self._cfg.get(CONF_INVERT_GRID):
            grid = -grid
        if self._cfg.get(CONF_INVERT_BATTERY):
            bat = -bat
        self._attr_native_value = self.entity_description.value_fn(max(pv, 0.0), grid, bat)
