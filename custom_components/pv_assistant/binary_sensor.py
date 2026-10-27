"""Problem sensor: a plant produces (almost) nothing while the other plants do.

A plant is an inverter with all of its power sensors (strings / MPPT inputs); a sensor that
belongs to no inverter is a plant of its own. Only plants whose sensors all have an entered peak
(settings tab) are compared, on the sum of their sensors. A plant counts as faulty when its power
stays below 5 % of its peak (or all of its sensors are unavailable) for 15 minutes while the
median of the other plants is at least 25 % of their peaks. Use the entity in automations to
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
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval
from homeassistant.util import dt as dt_util

from .const import CONF_PRODUCTION_POWER, DOMAIN
from .helpers import as_list, plants, watts

FAULT_AFTER = timedelta(minutes=15)
LOW_RATIO = 0.05  # plant below 5 % of its peak ...
OTHERS_MIN_RATIO = 0.25  # ... while the median of the others is at least 25 %


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    ids = as_list(entry.data.get(CONF_PRODUCTION_POWER))
    if len(ids) >= 2:  # a comparison needs at least two plants (sensors)
        async_add_entities([StringFaultSensor(entry, ids)])


class StringFaultSensor(BinarySensorEntity):
    """On while at least one plant is faulty."""

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
        settings = self.hass.data.get(DOMAIN, {}).get("settings", {})
        strings = settings.get("strings", {})
        inverters = settings.get("inverters", [])
        names = []
        entity_ids: list[str] = []
        for key in self._faulty:
            sensors = dict(plants(settings, self._ids)).get(key, [key])
            entity_ids.extend(sensors)
            inverter_name = next((i.get("name") for i in inverters if key in i.get("sensors", []) and i.get("name")), None)
            labels = []
            for eid in sensors:
                state = self.hass.states.get(eid)
                labels.append(strings.get(eid, {}).get("name") or (state.attributes.get("friendly_name") if state else None) or eid)
            names.append(inverter_name or " + ".join(labels))
        return {"plants": names, "strings": names, "entity_ids": entity_ids}

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
        settings = self.hass.data.get(DOMAIN, {}).get("settings", {})
        strings = settings.get("strings", {})
        ratios: dict[str, float | None] = {}
        for key, sensors in plants(settings, self._ids):
            peaks = [strings.get(eid, {}).get("peak") for eid in sensors]
            if not all(peak and peak > 0 for peak in peaks):  # every sensor of the plant needs a peak
                continue
            watts = [watts(self.hass.states.get(eid)) for eid in sensors]
            known = [max(w, 0.0) for w in watts if w is not None]
            ratios[key] = sum(known) / sum(peaks) if known else None
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
