"""Config flow for PV Assistant."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_BATTERY_POWER,
    CONF_GRID_POWER,
    CONF_INVERT_BATTERY,
    CONF_INVERT_GRID,
    CONF_PV_POWER,
    DOMAIN,
)

_POWER = selector.EntitySelector(
    selector.EntitySelectorConfig(domain="sensor", device_class="power")
)


def _schema(d: dict[str, Any]) -> vol.Schema:
    def sv(key: str) -> dict[str, Any]:
        return {"suggested_value": d.get(key)}

    return vol.Schema(
        {
            vol.Required(CONF_PV_POWER, description=sv(CONF_PV_POWER)): _POWER,
            vol.Required(CONF_GRID_POWER, description=sv(CONF_GRID_POWER)): _POWER,
            vol.Required(CONF_INVERT_GRID, default=d.get(CONF_INVERT_GRID, False)): bool,
            vol.Optional(CONF_BATTERY_POWER, description=sv(CONF_BATTERY_POWER)): _POWER,
            vol.Required(
                CONF_INVERT_BATTERY, default=d.get(CONF_INVERT_BATTERY, False)
            ): bool,
        }
    )


class PVAssistantConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the initial setup."""

    VERSION = 1

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
    def async_get_options_flow(config_entry) -> OptionsFlow:
        return PVAssistantOptionsFlow()


class PVAssistantOptionsFlow(OptionsFlow):
    """Edit the entity mapping later (reloads the entry)."""

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
