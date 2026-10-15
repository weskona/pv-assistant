"""Constants for PV Assistant."""

DOMAIN = "pv_assistant"

CONF_PRODUCTION_ENERGY = "production_energy_sensors"  # list, energy (kWh)
CONF_FEED_IN_ENERGY = "feed_in_energy_sensor"  # single, energy (kWh)
CONF_STORAGE_IN_ENERGY = "storage_in_energy_sensors"  # list, optional, energy into storage
CONF_STORAGE_OUT_ENERGY = "storage_out_energy_sensors"  # list, optional, energy from storage
CONF_STORAGE_COMBINED_ENERGY = "storage_combined_energy_sensors"  # list, optional, in and out in one sensor
CONF_INVERT_STORAGE_COMBINED = "invert_storage_combined"  # default: + = into storage

PANEL_URL = "pv-assistant"
PANEL_ELEMENT = "pv-assistant-panel"
STATIC_URL = "/pv_assistant_static"
