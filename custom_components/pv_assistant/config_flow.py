"""Config flow for PV Assistant.

Step 3 (forecast, all optional): forecast energy for today, for tomorrow and for the
rest of today (any number of energy sensors each).

Step 1 additionally has the reset confirmation time (minutes) of the energy filter:
a lower value is only accepted as a real reset if it persists that long.

Step 1 (energy sensors, kWh) and step 2 (power sensors, W) have the same layout:
production (several), feed-in (exactly one), storage in / out / combined
(several, optional; combined sign switchable, default positive = from storage).
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
    CONF_FORECAST_REMAINING,
    CONF_FORECAST_TODAY,
    CONF_FORECAST_TOMORROW,
    CONF_RESET_CONFIRM_MINUTES,
    DEFAULT_RESET_CONFIRM_MINUTES,
    CONF_FEED_IN_ENERGY,
    CONF_FEED_IN_POWER,
    CONF_INVERT_STORAGE_COMBINED,
    CONF_INVERT_STORAGE_COMBINED_POWER,
    CONF_PRODUCTION_ENERGY,
    CONF_PRODUCTION_POWER,
    CONF_STORAGE_COMBINED_ENERGY,
    CONF_STORAGE_COMBINED_POWER,
    CONF_STORAGE_IN_ENERGY,
    CONF_STORAGE_IN_POWER,
    CONF_STORAGE_OUT_ENERGY,
    CONF_STORAGE_OUT_POWER,
    DOMAIN,
)

# device_class -> (production, feed_in, storage_in, storage_out, storage_combined, invert)
_KEYS = {
    "energy": (
        CONF_PRODUCTION_ENERGY,
        CONF_FEED_IN_ENERGY,
        CONF_STORAGE_IN_ENERGY,
        CONF_STORAGE_OUT_ENERGY,
        CONF_STORAGE_COMBINED_ENERGY,
        CONF_INVERT_STORAGE_COMBINED,
    ),
    "power": (
        CONF_PRODUCTION_POWER,
        CONF_FEED_IN_POWER,
        CONF_STORAGE_IN_POWER,
        CONF_STORAGE_OUT_POWER,
        CONF_STORAGE_COMBINED_POWER,
        CONF_INVERT_STORAGE_COMBINED_POWER,
    ),
}
_FORECAST = (CONF_FORECAST_TODAY, CONF_FORECAST_TOMORROW, CONF_FORECAST_REMAINING)
_OPTIONAL = tuple(k for keys in _KEYS.values() for k in keys[2:5]) + _FORECAST


def _sensor(device_class: str, multiple: bool) -> selector.EntitySelector:
    return selector.EntitySelector(
        selector.EntitySelectorConfig(
            domain="sensor", device_class=device_class, multiple=multiple
        )
    )


def _schema(device_class: str, d: dict[str, Any]) -> vol.Schema:
    prod, feed, s_in, s_out, s_comb, invert = _KEYS[device_class]

    def sv(key: str) -> dict[str, Any]:
        return {"suggested_value": d.get(key)}

    return vol.Schema(
        {
            vol.Required(prod, description=sv(prod)): _sensor(device_class, True),
            vol.Required(feed, description=sv(feed)): _sensor(device_class, False),
            vol.Optional(s_in, description=sv(s_in)): _sensor(device_class, True),
            vol.Optional(s_out, description=sv(s_out)): _sensor(device_class, True),
            vol.Optional(s_comb, description=sv(s_comb)): _sensor(device_class, True),
            vol.Required(invert, default=d.get(invert, False)): bool,
            **(
                {
                    vol.Required(
                        CONF_RESET_CONFIRM_MINUTES,
                        default=d.get(CONF_RESET_CONFIRM_MINUTES, DEFAULT_RESET_CONFIRM_MINUTES),
                    ): selector.NumberSelector(
                        selector.NumberSelectorConfig(
                            min=1, max=120, step=1,
                            mode=selector.NumberSelectorMode.BOX,
                            unit_of_measurement="min",
                        )
                    )
                }
                if device_class == "energy"
                else {}
            ),
        }
    )


def _forecast_schema(d: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Optional(k, description={"suggested_value": d.get(k)}): _sensor("energy", True)
            for k in _FORECAST
        }
    )


class PVAssistantConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the initial setup."""

    VERSION = 3

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Step 1: energy sensors."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_power()
        return self.async_show_form(step_id="user", data_schema=_schema("energy", {}))

    async def async_step_power(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Step 2: power sensors."""
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_forecast()
        return self.async_show_form(step_id="power", data_schema=_schema("power", {}))

    async def async_step_forecast(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Step 3: forecast energy sensors (all optional)."""
        if user_input is not None:
            return self.async_create_entry(
                title="PV Assistant", data={**self._data, **user_input}
            )
        return self.async_show_form(step_id="forecast", data_schema=_forecast_schema({}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return PVAssistantOptionsFlow()


class PVAssistantOptionsFlow(OptionsFlow):
    """Edit the selection later (reloads the entry)."""

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_power()
        return self.async_show_form(
            step_id="init",
            data_schema=_schema("energy", dict(self.config_entry.data)),
        )

    async def async_step_power(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_forecast()
        return self.async_show_form(
            step_id="power",
            data_schema=_schema("power", dict(self.config_entry.data)),
        )

    async def async_step_forecast(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            self._data.update(user_input)
            data = {**self.config_entry.data, **self._data}
            for key in _OPTIONAL:  # cleared optional fields must be dropped
                if key not in self._data:
                    data.pop(key, None)
            self.hass.config_entries.async_update_entry(self.config_entry, data=data)
            return self.async_create_entry(data={})
        return self.async_show_form(
            step_id="forecast",
            data_schema=_forecast_schema(dict(self.config_entry.data)),
        )
