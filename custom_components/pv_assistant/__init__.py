"""PV Assistant: PV energy flow analysis with its own sidebar panel."""

from __future__ import annotations

from pathlib import Path

import voluptuous as vol

from homeassistant.components import panel_custom, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    CONF_FORECAST_TODAY,
    CONF_PRODUCTION_ENERGY,
    CONF_PRODUCTION_POWER,
    DOMAIN,
    MAX_NAME_LENGTH,
    MAX_PEAK_W,
    PANEL_ELEMENT,
    PANEL_URL,
    SETTINGS_STORE_KEY,
    SETTINGS_STORE_VERSION,
    STATIC_URL,
)
from .sensor import filtered_unique_id, source_entity_ids

PLATFORMS = ["sensor", "binary_sensor"]


@websocket_api.websocket_command({vol.Required("type"): "pv_assistant/config"})
@callback
def _ws_config(hass: HomeAssistant, connection, msg: dict) -> None:
    """Hand the configured sensor selection to the panel."""
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        connection.send_result(msg["id"], {})
        return
    entry = entries[0]
    reg = er.async_get(hass)
    filtered = {}
    for src in source_entity_ids(dict(entry.data)):
        eid = reg.async_get_entity_id("sensor", DOMAIN, filtered_unique_id(entry.entry_id, src))
        if eid:
            filtered[src] = eid
    settings = hass.data.get(DOMAIN, {}).get("settings", {})
    connection.send_result(msg["id"], {**entry.data, "filtered": filtered, "settings": settings})


def _as_list(value) -> list[str]:
    return [value] if isinstance(value, str) else list(value or [])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "pv_assistant/set_settings",
        vol.Required("strings"): {
            str: {
                vol.Optional("name"): vol.All(str, vol.Length(max=MAX_NAME_LENGTH)),
                vol.Optional("peak"): vol.All(vol.Coerce(float), vol.Range(min=0, max=MAX_PEAK_W)),
                # orientation (azimuth like Forecast.Solar: south = 0, east = -90, west = 90) and tilt in degrees; None = not set
                vol.Optional("azimuth"): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=-180, max=180))),
                vol.Optional("tilt"): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0, max=90))),
                # optional second orientation of the same string and its share of the peak in percent
                vol.Optional("azimuth2"): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=-180, max=180))),
                vol.Optional("tilt2"): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0, max=90))),
                vol.Optional("share2"): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0, max=100))),
            }
        },
        # plant-wide numbers (empty / 0 = not set)
        vol.Optional("general"): {
            vol.Optional("storage_capacity_kwh"): vol.All(vol.Coerce(float), vol.Range(min=0, max=100000)),
            vol.Optional("battery_min_soc"): vol.All(vol.Coerce(float), vol.Range(min=0, max=100)),
            vol.Optional("price_import"): vol.All(vol.Coerce(float), vol.Range(min=0, max=100)),
            vol.Optional("price_feed_in"): vol.All(vol.Coerce(float), vol.Range(min=0, max=100)),
            vol.Optional("system_cost_eur"): vol.All(vol.Coerce(float), vol.Range(min=0, max=100000000)),
            vol.Optional("co2_g_per_kwh"): vol.All(vol.Coerce(float), vol.Range(min=0, max=2000)),
            # plant location, overrides the Home Assistant home location (0 / empty = use Home Assistant)
            vol.Optional("latitude"): vol.All(vol.Coerce(float), vol.Range(min=-90, max=90)),
            vol.Optional("longitude"): vol.All(vol.Coerce(float), vol.Range(min=-180, max=180)),
        },
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_set_settings(hass: HomeAssistant, connection, msg: dict) -> None:
    """Save display names, peak power and orientation per string (merged per sensor, empty = reset) and the plant-wide numbers."""
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries:
        connection.send_error(msg["id"], "not_configured", "PV Assistant is not set up")
        return
    data = entries[0].data
    allowed = set(_as_list(data.get(CONF_PRODUCTION_POWER))) | set(_as_list(data.get(CONF_PRODUCTION_ENERGY)))
    unknown = set(msg["strings"]) - allowed
    if unknown:
        connection.send_error(msg["id"], "invalid_sensor", f"Not a configured production sensor: {', '.join(sorted(unknown))}")
        return
    store = hass.data[DOMAIN]
    strings = dict(store.get("settings", {}).get("strings", {}))
    for entity_id, values in msg["strings"].items():
        clean = {}
        if name := values.get("name", "").strip():
            clean["name"] = name
        if (peak := values.get("peak") or 0) > 0:
            clean["peak"] = peak
        for key in ("azimuth", "tilt", "azimuth2", "tilt2", "share2"):  # 0 is a valid value (south, flat), so only None means "not set"
            if values.get(key) is not None:
                clean[key] = values[key]
        if clean:
            strings[entity_id] = clean
        else:
            strings.pop(entity_id, None)
    general = dict(store.get("settings", {}).get("general", {}))
    if "general" in msg:
        for key, value in msg["general"].items():
            if value and (value > 0 or key in ("latitude", "longitude")):  # coordinates may be negative
                general[key] = value
            else:
                general.pop(key, None)
    store["settings"] = {**store.get("settings", {}), "strings": strings, "general": general}
    await store["store"].async_save(store["settings"])
    connection.send_result(msg["id"], store["settings"])


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up PV Assistant from a config entry."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if "store" not in domain_data:
        domain_data["store"] = Store(hass, SETTINGS_STORE_VERSION, SETTINGS_STORE_KEY)
        domain_data["settings"] = await domain_data["store"].async_load() or {}
    if not domain_data.get("panel"):
        websocket_api.async_register_command(hass, _ws_config)
        websocket_api.async_register_command(hass, _ws_set_settings)
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    STATIC_URL, str(Path(__file__).parent / "frontend"), False
                )
            ]
        )
        await panel_custom.async_register_panel(
            hass,
            webcomponent_name=PANEL_ELEMENT,
            frontend_url_path=PANEL_URL,
            module_url=f"{STATIC_URL}/pv-assistant-panel.js",
            sidebar_title="PV Assistant",
            sidebar_icon="mdi:solar-power",
            require_admin=False,
        )
        domain_data["panel"] = True

    _track_forecast(hass, entry)
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


FORECAST_LOG_DAYS = 800


def _kwh(state) -> float | None:
    """State of a forecast energy sensor in kWh (None when unknown / unavailable)."""
    if state is None or state.state in ("unknown", "unavailable"):
        return None
    try:
        value = float(state.state)
    except ValueError:
        return None
    return value * {"Wh": 0.001, "MWh": 1000}.get(state.attributes.get("unit_of_measurement"), 1)


def _track_forecast(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Remember the last forecast of every day (sum of the 'forecast today' sensors) so the
    panel can compare forecast and actual production afterwards."""
    ids = _as_list(entry.data.get(CONF_FORECAST_TODAY))
    if not ids:
        return
    domain_data = hass.data[DOMAIN]

    @callback
    def _log(_event=None) -> None:
        values = [_kwh(hass.states.get(i)) for i in ids]
        if None in values:  # never log a partial sum
            return
        total = round(sum(values), 2)
        log = domain_data["settings"].setdefault("forecast_log", {})
        today = dt_util.now().date().isoformat()
        if log.get(today) == total:
            return
        log[today] = total
        for old in sorted(log)[:-FORECAST_LOG_DAYS]:
            del log[old]
        domain_data["store"].async_delay_save(lambda: domain_data["settings"], 60)

    entry.async_on_unload(async_track_state_change_event(hass, ids, _log))
    _log()


async def _async_reload(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry; remove the panel with the last entry."""
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok and not hass.config_entries.async_loaded_entries(DOMAIN):
        from homeassistant.components import frontend

        frontend.async_remove_panel(hass, PANEL_URL)
        hass.data.get(DOMAIN, {}).pop("panel", None)
    return ok
