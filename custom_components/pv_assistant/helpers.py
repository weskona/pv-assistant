"""Helpers shared by the platforms: unit conversion, plants and prices."""

from __future__ import annotations

from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant, State

from .const import DOMAIN


def as_list(value: Any) -> list[str]:
    """A config value that is either one entity id or a list of them, as a list."""
    return [value] if isinstance(value, str) else list(value or [])


def _number(state: State | None) -> float | None:
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return None
    try:
        return float(state.state)
    except ValueError:
        return None


def watts(state: State | None) -> float | None:
    """State of a power sensor in W (None when unknown / unavailable)."""
    value = _number(state)
    if value is None:
        return None
    return value * {"kW": 1000, "MW": 1e6}.get(state.attributes.get("unit_of_measurement"), 1)


def kwh(state: State | None) -> float | None:
    """State of an energy sensor in kWh (None when unknown / unavailable)."""
    value = _number(state)
    if value is None:
        return None
    return value * {"Wh": 0.001, "MWh": 1000}.get(state.attributes.get("unit_of_measurement"), 1)


def settings(hass: HomeAssistant) -> dict[str, Any]:
    """The settings saved from the panel (names, peaks, inverters, plant values)."""
    return hass.data.get(DOMAIN, {}).get("settings", {})


def plants(config: dict[str, Any], ids: list[str]) -> list[tuple[str, list[str]]]:
    """Plants as (key, sensor ids): the saved inverters, then every other sensor on its own."""
    result: list[tuple[str, list[str]]] = []
    taken: set[str] = set()
    for inverter in config.get("inverters", []):
        sensors = [i for i in inverter.get("sensors", []) if i in ids and i not in taken]
        if sensors:
            taken.update(sensors)
            result.append((sensors[0], sensors))
    for eid in ids:
        if eid not in taken:
            result.append((eid, [eid]))
    return result


def plant_peak(config: dict[str, Any], sensors: list[str]) -> float | None:
    """Sum of the peaks of a plant's sensors; None unless every sensor has one."""
    strings = config.get("strings", {})
    peaks = [strings.get(eid, {}).get("peak") for eid in sensors]
    if not peaks or not all(peak and peak > 0 for peak in peaks):
        return None
    return float(sum(peaks))


def plant_label(hass: HomeAssistant, key: str, sensors: list[str]) -> str:
    """Name of a plant: the inverter name, otherwise the names of its sensors joined with ' + '."""
    config = settings(hass)
    for inverter in config.get("inverters", []):
        if key in inverter.get("sensors", []) and inverter.get("name"):
            return str(inverter["name"])
    labels = []
    for eid in sensors:
        state = hass.states.get(eid)
        labels.append(
            config.get("strings", {}).get(eid, {}).get("name")
            or (state.attributes.get("friendly_name") if state else None)
            or eid
        )
    return " + ".join(labels)


def prices(hass: HomeAssistant, data: dict[str, Any]) -> tuple[float | None, float | None]:
    """(import price, feed-in tariff) per kWh: the price sensor of the config flow, otherwise the value from the settings."""
    general = settings(hass).get("general", {})
    result: list[float | None] = []
    for conf_key, general_key in (("price_import", "price_import"), ("price_feed_in", "price_feed_in")):
        value = _number(hass.states.get(data[conf_key])) if data.get(conf_key) else None
        if not value:
            value = general.get(general_key) or None
        result.append(float(value) if value else None)
    return result[0], result[1]
