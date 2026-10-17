"""PV Assistant: PV energy flow analysis with its own sidebar panel."""

from __future__ import annotations

from pathlib import Path

import voluptuous as vol

from homeassistant.components import panel_custom, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store

from .const import (
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

PLATFORMS = ["sensor"]


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
            }
        },
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def _ws_set_settings(hass: HomeAssistant, connection, msg: dict) -> None:
    """Save display names and peak power per string (merged per sensor, empty = reset)."""
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
        if clean:
            strings[entity_id] = clean
        else:
            strings.pop(entity_id, None)
    store["settings"] = {"strings": strings}
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

    entry.async_on_unload(entry.add_update_listener(_async_reload))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


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
