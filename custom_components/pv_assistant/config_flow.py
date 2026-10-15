"""Config flow for PV Assistant.

Step 1 (user/init): power sensors - any number of production sensors, exactly one
grid sensor (feed-in or combined).
Step 2 (prices): sensor or input_number for grid import price and feed-in tariff.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    ConfigSubentryFlow,
    OptionsFlow,
    SubentryFlowResult,
)
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er, selector

from .const import (
    CONF_BATTERY_COMBINED,
    CONF_BATTERY_IN,
    CONF_BATTERY_OUT,
    CONF_DEVICE,
    CONF_FEED_IN,
    CONF_GRID_COMBINED,
    CONF_INVERT_BATTERY,
    CONF_INVERT_GRID,
    CONF_PRICE_FEED_IN,
    CONF_PRICE_GRID,
    CONF_PRODUCTION,
    DOMAIN,
    SUBENTRY_STORAGE,
)


def _power(multiple: bool, include: list[str] | None = None) -> selector.EntitySelector:
    return selector.EntitySelector(
        selector.EntitySelectorConfig(
            domain="sensor",
            device_class="power",
            multiple=multiple,
            **({"include_entities": include} if include else {}),
        )
    )


_OPTIONAL = (
    CONF_FEED_IN,
    CONF_GRID_COMBINED,
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

    @classmethod
    @callback
    def async_get_supported_subentry_types(
        cls, config_entry: ConfigEntry
    ) -> dict[str, type[ConfigSubentryFlow]]:
        return {SUBENTRY_STORAGE: StorageSubentryFlow}


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


def _storage_schema(
    d: dict[str, Any], include: list[str] | None
) -> vol.Schema:
    return vol.Schema(
        {
            vol.Optional(CONF_BATTERY_IN, description=_sv(d, CONF_BATTERY_IN)): _power(True, include),
            vol.Optional(CONF_BATTERY_OUT, description=_sv(d, CONF_BATTERY_OUT)): _power(True, include),
            vol.Optional(CONF_BATTERY_COMBINED, description=_sv(d, CONF_BATTERY_COMBINED)): _power(True, include),
            vol.Required(CONF_INVERT_BATTERY, default=d.get(CONF_INVERT_BATTERY, False)): bool,
        }
    )


class StorageSubentryFlow(ConfigSubentryFlow):
    """One storage (battery system): name, optional device, its power sensors.

    With a device chosen, the sensor pickers only offer that device's power
    sensors, so several storages can be split cleanly.
    """

    def __init__(self) -> None:
        self._base: dict[str, Any] = {}

    def _current(self) -> dict[str, Any]:
        if self.source == "reconfigure":
            return {"name": self._get_reconfigure_subentry().title, **self._get_reconfigure_subentry().data}
        return {}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        cur = self._current()
        if user_input is not None:
            self._base = user_input
            return await self.async_step_sensors()
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required("name", default=cur.get("name", "")): str,
                    vol.Optional(CONF_DEVICE, description=_sv(cur, CONF_DEVICE)): selector.DeviceSelector(),
                }
            ),
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        return await self.async_step_user(user_input)

    async def async_step_sensors(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        cur = self._current()
        errors: dict[str, str] = {}
        if user_input is not None:
            if not any(user_input.get(k) for k in (CONF_BATTERY_IN, CONF_BATTERY_OUT, CONF_BATTERY_COMBINED)):
                errors["base"] = "storage_sensor_required"
            else:
                data = {k: v for k, v in user_input.items()}
                if self._base.get(CONF_DEVICE):
                    data[CONF_DEVICE] = self._base[CONF_DEVICE]
                if self.source == "reconfigure":
                    return self.async_update_and_abort(
                        self._get_entry(),
                        self._get_reconfigure_subentry(),
                        title=self._base["name"],
                        data=data,
                    )
                return self.async_create_entry(title=self._base["name"], data=data)
        include = None
        if device_id := self._base.get(CONF_DEVICE):
            reg = er.async_get(self.hass)
            include = [
                e.entity_id
                for e in er.async_entries_for_device(reg, device_id)
                if e.domain == "sensor"
            ] or None
        return self.async_show_form(
            step_id="sensors",
            data_schema=_storage_schema(user_input or cur, include),
            errors=errors,
        )
