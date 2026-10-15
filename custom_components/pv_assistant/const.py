"""Constants for PV Assistant."""

DOMAIN = "pv_assistant"

CONF_PRODUCTION = "production_sensors"  # list, power
CONF_FEED_IN = "feed_in_sensor"  # single, power
CONF_BATTERY_IN = "battery_in_sensors"  # list, power (into storage)
CONF_BATTERY_OUT = "battery_out_sensors"  # list, power (from storage)
CONF_PRICE_GRID = "price_grid_import"  # sensor / input_number, price per kWh
CONF_PRICE_FEED_IN = "price_feed_in"  # sensor / input_number, tariff per kWh

PANEL_URL = "pv-assistant"
PANEL_ELEMENT = "pv-assistant-panel"
STATIC_URL = "/pv_assistant_static"
