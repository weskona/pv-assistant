"""PV Assistant: PV energy flow analysis with its own sidebar panel."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PANEL_ELEMENT, PANEL_URL, STATIC_URL

PLATFORMS: list[str] = []


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up PV Assistant from a config entry."""
    if not hass.data.get(DOMAIN, {}).get("panel"):
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
        hass.data.setdefault(DOMAIN, {})["panel"] = True

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
