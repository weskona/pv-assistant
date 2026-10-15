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
    CONF_BATTERY_IN,
    CONF_BATTERY_OUT,
    CONF_FEED_IN,
    CONF_PRODUCTION,
    DOMAIN,
)


@dataclass(frozen=True, kw_only=True)
class PVDescription(SensorEntityDescription):
    sources: tuple[str, ...]
    value_fn: Callable[[dict[str, float]], float | None]


def _self_consumption(v: dict[str, float]) -> float | None:
    if v[CONF_PRODUCTION] <= 0:
        return None
    exported = min(v[CONF_FEED_IN], v[CONF_PRODUCTION])
    return round(100 * (v[CONF_PRODUCTION] - exported) / v[CONF_PRODUCTION], 1)


_W = dict(
    native_unit_of_measurement=UnitOfPower.WATT,
    device_class=SensorDeviceClass.POWER,
    state_class=SensorStateClass.MEASUREMENT,
)

DESCRIPTIONS = (
    PVDescription(key="production", translation_key="production", sources=(CONF_PRODUCTION,), value_fn=lambda v: round(v[CONF_PRODUCTION]), **_W),
    PVDescription(key="feed_in", translation_key="feed_in", sources=(CONF_FEED_IN,), value_fn=lambda v: round(v[CONF_FEED_IN]), **_W),
    PVDescription(key="battery_in", translation_key="battery_in", sources=(CONF_BATTERY_IN,), value_fn=lambda v: round(v[CONF_BATTERY_IN]), **_W),
    PVDescription(key="battery_out", translation_key="battery_out", sources=(CONF_BATTERY_OUT,), value_fn=lambda v: round(v[CONF_BATTERY_OUT]), **_W),
    PVDescription(
        key="self_consumption", translation_key="self_consumption",
        sources=(CONF_PRODUCTION, CONF_FEED_IN), value_fn=_self_consumption,
        native_unit_of_measurement=PERCENTAGE, state_class=SensorStateClass.MEASUREMENT,
    ),
)


def _ids(cfg: dict[str, Any], key: str) -> list[str]:
    v = cfg.get(key) or []
    return [v] if isinstance(v, str) else list(v)


def _sum_watts(hass: HomeAssistant, entity_ids: list[str]) -> float | None:
    total = 0.0
    for eid in entity_ids:
        st = hass.states.get(eid)
        if st is None or st.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
            return None
        try:
            val = float(st.state)
        except ValueError:
            return None
        unit = st.attributes.get("unit_of_measurement")
        total += val * {"kW": 1000, "MW": 1e6}.get(unit, 1)
    return total


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    cfg = dict(entry.data)
    async_add_entities(
        PVSensor(entry, cfg, d)
        for d in DESCRIPTIONS
        if all(_ids(cfg, s) for s in d.sources)
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
        ids = [i for s in self.entity_description.sources for i in _ids(self._cfg, s)]

        @callback
        def _changed(_: Event) -> None:
            self._recalc()
            self.async_write_ha_state()

        self.async_on_remove(async_track_state_change_event(self.hass, ids, _changed))
        self._recalc()

    def _recalc(self) -> None:
        values: dict[str, float] = {}
        for s in self.entity_description.sources:
            total = _sum_watts(self.hass, _ids(self._cfg, s))
            if total is None:
                self._attr_native_value = None
                return
            values[s] = max(total, 0.0)
        self._attr_native_value = self.entity_description.value_fn(values)
