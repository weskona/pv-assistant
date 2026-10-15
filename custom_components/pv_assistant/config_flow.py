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
    CONF_BATTERY_COMBINED,
    CONF_BATTERY_OUT,
    CONF_FEED_IN,
    CONF_GRID_COMBINED,
    CONF_INVERT_BATTERY,
    CONF_INVERT_GRID,
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


_OPTIONAL = (
    CONF_FEED_IN,
    CONF_GRID_COMBINED,
    CONF_BATTERY_IN,
    CONF_BATTERY_OUT,
    CONF_BATTERY_COMBINED,
)


def _validate(user_input: dict[str, Any]) -> dict[str, str]:
    """Exactly one grid sensor: either feed-in or combined."""
    has_feed, has_comb = bool(user_input.get(CONF_FEED_IN)), bool(user_input.get(CONF_GRID_COMBINED))
    if has_feed and has_comb:
        return {"base": "grid_conflict"}
    if not (has_feed or has_comb):
        return {"base": "grid_required"}
    return {}


_PRICE = selector.EntitySelector(
    selector.EntitySelectorConfig(domain=["sensor", "input_number"])
)


def _sv(d: dict[str, Any], key: str) -> dict[str, Any]:
    return {"suggested_value": d.get(key)}


def _sensor_schema(d: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_PRODUCTION, description=_sv(d, CONF_PRODUCTION)): _power(True),
            vol.Optional(CONF_FEED_IN, description=_sv(d, CONF_FEED_IN)): _power(False),
            vol.Optional(CONF_GRID_COMBINED, description=_sv(d, CONF_GRID_COMBINED)): _power(False),
            vol.Required(CONF_INVERT_GRID, default=d.get(CONF_INVERT_GRID, False)): bool,
            vol.Optional(CONF_BATTERY_IN, description=_sv(d, CONF_BATTERY_IN)): _power(True),
            vol.Optional(CONF_BATTERY_OUT, description=_sv(d, CONF_BATTERY_OUT)): _power(True),
            vol.Optional(CONF_BATTERY_COMBINED, description=_sv(d, CONF_BATTERY_COMBINED)): _power(True),
            vol.Required(CONF_INVERT_BATTERY, default=d.get(CONF_INVERT_BATTERY, False)): bool,
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
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate(user_input)
            if not errors:
                self._data.update(user_input)
                return await self.async_step_prices()
        return self.async_show_form(
            step_id="user",
            data_schema=_sensor_schema(user_input or {}),
            errors=errors,
        )

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
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate(user_input)
            if not errors:
                self._data.update(user_input)
                return await self.async_step_prices()
        return self.async_show_form(
            step_id="init",
            data_schema=_sensor_schema(user_input or dict(self.config_entry.data)),
            errors=errors,
        )

    async def async_step_prices(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            # Optional fields cleared in the form must be dropped, not kept.
            new = {**self.config_entry.data, **self._data, **user_input}
            for k in _OPTIONAL:
                if k not in self._data:
                    new.pop(k, None)
            self.hass.config_entries.async_update_entry(self.config_entry, data=new)
            return self.async_create_entry(data={})
        return self.async_show_form(
            step_id="prices", data_schema=_price_schema(dict(self.config_entry.data))
        )
