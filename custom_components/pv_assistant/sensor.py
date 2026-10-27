"""Filtered (glitch-free) copies of the configured energy sensors.

Some meters briefly drop to 0 (or unavailable) and then return to the real value.
For total_increasing consumers such as utility_meter that looks like a reset plus
new production. The filtered sensor holds the last valid value instead; a lower
value is only accepted as a real reset once it has persisted for the configured
number of minutes. Use these sensors as source for utility_meter.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, HomeAssistant, State, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from .calc import async_setup_calc
from .const import (
    CONF_FEED_IN_ENERGY,
    CONF_PRODUCTION_ENERGY,
    CONF_RESET_CONFIRM_MINUTES,
    CONF_STORAGE_IN_ENERGY,
    CONF_STORAGE_OUT_ENERGY,
    DEFAULT_RESET_CONFIRM_MINUTES,
    DOMAIN,
)

# Combined storage energy sensors are NOT filtered: a net sensor may legitimately decrease.
FILTERED_KEYS = (
    CONF_PRODUCTION_ENERGY,
    CONF_FEED_IN_ENERGY,
    CONF_STORAGE_IN_ENERGY,
    CONF_STORAGE_OUT_ENERGY,
)
NOISE = 0.01  # decreases up to this (in source unit) are rounding noise, ignored


def source_entity_ids(data: dict[str, Any]) -> list[str]:
    """All energy sensors that get a filtered copy (deduplicated, ordered)."""
    ids: list[str] = []
    for key in FILTERED_KEYS:
        v = data.get(key) or []
        for eid in [v] if isinstance(v, str) else v:
            if eid not in ids:
                ids.append(eid)
    return ids


def filtered_unique_id(entry_id: str, source: str) -> str:
    return f"{entry_id}_{source}_filtered"


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    minutes = int(entry.data.get(CONF_RESET_CONFIRM_MINUTES, DEFAULT_RESET_CONFIRM_MINUTES))
    async_add_entities(
        FilteredEnergySensor(entry, src, minutes) for src in source_entity_ids(dict(entry.data))
    )
    await async_setup_calc(hass, entry, async_add_entities)


def _number(state: State | None) -> float | None:
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return None
    try:
        return float(state.state)
    except ValueError:
        return None


class FilteredEnergySensor(SensorEntity):
    """Holds the last valid value of a source energy sensor."""

    _attr_should_poll = False
    _attr_device_class = SensorDeviceClass.ENERGY
    _attr_state_class = SensorStateClass.TOTAL_INCREASING

    def __init__(self, entry: ConfigEntry, source: str, minutes: int) -> None:
        self._source = source
        self._delay = minutes * 60
        self._pending = False
        self._unsub_timer = None
        self._attr_unique_id = filtered_unique_id(entry.entry_id, source)
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)}, name="PV Assistant"
        )

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"source": self._source, "pending_reset": self._pending}

    async def async_added_to_hass(self) -> None:
        state = self.hass.states.get(self._source)
        name = (state.attributes.get("friendly_name") if state else None) or self._source
        suffix = "bereinigt" if self.hass.config.language.startswith("de") else "filtered"
        self._attr_name = f"{name} {suffix}"
        self.async_on_remove(
            async_track_state_change_event(self.hass, [self._source], self._changed)
        )
        self.async_on_remove(self._cancel_timer)
        self._process(state)

    @callback
    def _changed(self, event: Event) -> None:
        self._process(event.data.get("new_state"))
        self.async_write_ha_state()

    @callback
    def _cancel_timer(self) -> None:
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None

    def _accept(self, state: State, value: float) -> None:
        self._attr_native_value = value
        self._attr_native_unit_of_measurement = state.attributes.get("unit_of_measurement")
        self._pending = False
        self._cancel_timer()

    def _process(self, state: State | None) -> None:
        value = _number(state)
        if value is None:  # unknown / unavailable / not a number: keep last valid value
            return
        last = self._attr_native_value
        if last is None or value >= last:
            self._accept(state, value)
        elif last - value > NOISE and not self._pending:
            # Lower value: hold the old one; a real reset must persist.
            self._pending = True
            self._unsub_timer = async_call_later(self.hass, self._delay, self._confirm)

    @callback
    def _confirm(self, _now: Any) -> None:
        self._unsub_timer = None
        state = self.hass.states.get(self._source)
        value = _number(state)
        if value is not None and self._attr_native_value is not None and value < self._attr_native_value:
            self._accept(state, value)  # stayed low: real reset
        self._pending = False
        self.async_write_ha_state()
