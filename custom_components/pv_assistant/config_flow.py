"""Config flow for PV Assistant.

Step 1: production energy sensors (several), power sensors (several),
feed-in energy sensor (exactly one).
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import CONF_FEED_IN_ENERGY, CONF_POWER, CONF_PRODUCTION_ENERGY, DOMAIN


def _sensor(device_class: str, multiple: bool) -> selector.EntitySelector:
    return selector.EntitySelector(
        selector.EntitySelectorConfig(
            domain="sensor", device_class=device_class, multiple=multiple
        )
    )


def _schema(d: dict[str, Any]) -> vol.Schema:
    def sv(key: str) -> dict[str, Any]:
        return {"suggested_value": d.get(key)}

    return vol.Schema(
        {
            vol.Required(CONF_PRODUCTION_ENERGY, description=sv(CONF_PRODUCTION_ENERGY)): _sensor("energy", True),
            vol.Required(CONF_POWER, description=sv(CONF_POWER)): _sensor("power", True),
            vol.Required(CONF_FEED_IN_ENERGY, description=sv(CONF_FEED_IN_ENERGY)): _sensor("energy", False),
        }
    )


class PVAssistantConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the initial setup."""

    VERSION = 2

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="PV Assistant", data=user_input)
        return self.async_show_form(step_id="user", data_schema=_schema({}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return PVAssistantOptionsFlow()


class PVAssistantOptionsFlow(OptionsFlow):
    """Edit the selection later (reloads the entry)."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            self.hass.config_entries.async_update_entry(
                self.config_entry, data={**self.config_entry.data, **user_input}
            )
            return self.async_create_entry(data={})
        return self.async_show_form(
            step_id="init", data_schema=_schema(dict(self.config_entry.data))
        )
