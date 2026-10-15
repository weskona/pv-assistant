"""Config flow for PV Assistant.

Step 1 (user/init): power sensors - any number of production, battery-in and
battery-out sensors, exactly one feed-in sensor.
Step 2 (prices): sensor or input_number for grid import price and feed-in tariff.
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

from .const import (
    CONF_BATTERY_IN,
    CONF_BATTERY_OUT,
    CONF_FEED_IN,
    CONF_PRICE_FEED_IN,
    CONF_PRICE_GRID,
    CONF_PRODUCTION,
    DOMAIN,
)


def _power(multiple: bool) -> selector.EntitySelector:
    return selector.EntitySelector(
        selector.EntitySelectorConfig(
            domain="sensor", device_class="power", multiple=multiple
        )
    )


_PRICE = selector.EntitySelector(
    selector.EntitySelectorConfig(domain=["sensor", "input_number"])
)


def _sv(d: dict[str, Any], key: str) -> dict[str, Any]:
    return {"suggested_value": d.get(key)}


def _sensor_schema(d: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_PRODUCTION, description=_sv(d, CONF_PRODUCTION)): _power(True),
            vol.Required(CONF_FEED_IN, description=_sv(d, CONF_FEED_IN)): _power(False),
            vol.Optional(CONF_BATTERY_IN, description=_sv(d, CONF_BATTERY_IN)): _power(True),
            vol.Optional(CONF_BATTERY_OUT, description=_sv(d, CONF_BATTERY_OUT)): _power(True),
        }
    )


def _price_schema(d: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_PRICE_GRID, description=_sv(d, CONF_PRICE_GRID)): _PRICE,
            vol.Required(CONF_PRICE_FEED_IN, description=_sv(d, CONF_PRICE_FEED_IN)): _PRICE,
        }
    )


class PVAssistantConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the initial setup."""

    VERSION = 1

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_prices()
        return self.async_show_form(step_id="user", data_schema=_sensor_schema({}))

    async def async_step_prices(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(
                title="PV Assistant", data={**self._data, **user_input}
            )
        return self.async_show_form(step_id="prices", data_schema=_price_schema({}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return PVAssistantOptionsFlow()


class PVAssistantOptionsFlow(OptionsFlow):
    """Edit the mapping later (reloads the entry)."""

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_prices()
        return self.async_show_form(
            step_id="init", data_schema=_sensor_schema(dict(self.config_entry.data))
        )

    async def async_step_prices(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            # Optional fields cleared in the form must be dropped, not kept.
            new = {**self.config_entry.data, **self._data, **user_input}
            for k in (CONF_BATTERY_IN, CONF_BATTERY_OUT):
                if k not in self._data:
                    new.pop(k, None)
            self.hass.config_entries.async_update_entry(self.config_entry, data=new)
            return self.async_create_entry(data={})
        return self.async_show_form(
            step_id="prices", data_schema=_price_schema(dict(self.config_entry.data))
        )
