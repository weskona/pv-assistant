"""Problem sensor: a string produces (almost) nothing while the other strings do.

Only strings with an entered peak (settings tab) are compared. A string counts as faulty when
its power stays below 5 % of its peak (or the sensor is unavailable) for 15 minutes while the
median of the other strings is at least 25 % of their peaks. Use the entity in automations to
get notified.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, HomeAssistant, State, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval
from homeassistant.util import dt as dt_util

from .const import CONF_PRODUCTION_POWER, DOMAIN

FAULT_AFTER = timedelta(minutes=15)
LOW_RATIO = 0.05  # string below 5 % of its peak ...
OTHERS_MIN_RATIO = 0.25  # ... while the median of the others is at least 25 %


def _ids(value: Any) -> list[str]:
    return [value] if isinstance(value, str) else list(value or [])


def _watts(state: State | None) -> float | None:
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return None
    try:
        value = float(state.state)
    except ValueError:
        return None
    return value * {"kW": 1000, "MW": 1e6}.get(state.attributes.get("unit_of_measurement"), 1)


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    ids = _ids(entry.data.get(CONF_PRODUCTION_POWER))
    if len(ids) >= 2:  # a comparison needs at least two strings
        async_add_entities([StringFaultSensor(entry, ids)])


class StringFaultSensor(BinarySensorEntity):
    """On while at least one string is faulty."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_device_class = BinarySensorDeviceClass.PROBLEM
    _attr_translation_key = "string_fault"

    def __init__(self, entry: ConfigEntry, ids: list[str]) -> None:
        self._ids = ids
        self._since: dict[str, Any] = {}
        self._faulty: list[str] = []
        self._attr_is_on = False
        self._attr_unique_id = f"{entry.entry_id}_string_fault"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)}, name="PV Assistant"
        )

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        settings = self.hass.data.get(DOMAIN, {}).get("settings", {}).get("strings", {})
        names = []
        for eid in self._faulty:
            state = self.hass.states.get(eid)
            names.append(settings.get(eid, {}).get("name") or (state.attributes.get("friendly_name") if state else None) or eid)
        return {"strings": names, "entity_ids": list(self._faulty)}

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_track_state_change_event(self.hass, self._ids, self._changed))
        self.async_on_remove(async_track_time_interval(self.hass, self._tick, timedelta(minutes=1)))
        self._evaluate()

    @callback
    def _changed(self, _event: Event) -> None:
        self._evaluate()
        self.async_write_ha_state()

    @callback
    def _tick(self, _now: Any) -> None:
        self._evaluate()
        self.async_write_ha_state()

    def _evaluate(self) -> None:
        strings = self.hass.data.get(DOMAIN, {}).get("settings", {}).get("strings", {})
        ratios: dict[str, float | None] = {}
        for eid in self._ids:
            peak = strings.get(eid, {}).get("peak")
            if not peak or peak <= 0:
                continue
            watts = _watts(self.hass.states.get(eid))
            ratios[eid] = None if watts is None else max(watts, 0.0) / peak
        now = dt_util.utcnow()
        faulty: list[str] = []
        for eid, ratio in ratios.items():
            others = sorted(v for k, v in ratios.items() if k != eid and v is not None)
            others_ok = bool(others) and others[len(others) // 2] >= OTHERS_MIN_RATIO
            if others_ok and (ratio is None or ratio < LOW_RATIO):
                since = self._since.setdefault(eid, now)
                if now - since >= FAULT_AFTER:
                    faulty.append(eid)
            else:
                self._since.pop(eid, None)
        self._faulty = faulty
        self._attr_is_on = bool(faulty)
