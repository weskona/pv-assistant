"""Constants for PV Assistant."""

DOMAIN = "pv_assistant"

# Main entry
CONF_PRODUCTION = "production_sensors"  # list, power
CONF_FEED_IN = "feed_in_sensor"  # single, power
CONF_GRID_COMBINED = "grid_combined_sensor"  # single, alternative to feed-in sensor
CONF_INVERT_GRID = "invert_grid"  # default: + = import, - = export
CONF_PRICE_GRID = "price_grid_import"  # sensor / input_number, price per kWh
CONF_PRICE_FEED_IN = "price_feed_in"  # sensor / input_number, tariff per kWh

# Storage subentry (one per battery / storage system)
SUBENTRY_STORAGE = "storage"
CONF_DEVICE = "device_id"  # optional HA device the sensors are picked from
CONF_BATTERY_IN = "battery_in_sensors"  # list, power (into storage)
CONF_BATTERY_OUT = "battery_out_sensors"  # list, power (from storage)
CONF_BATTERY_COMBINED = "battery_combined_sensors"  # list, + = charging by default
CONF_INVERT_BATTERY = "invert_battery"

PANEL_URL = "pv-assistant"
PANEL_ELEMENT = "pv-assistant-panel"
STATIC_URL = "/pv_assistant_static"
