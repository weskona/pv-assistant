"""Constants for PV Assistant."""

DOMAIN = "pv_assistant"

CONF_PRODUCTION_ENERGY = "production_energy_sensors"  # list, energy (kWh)
CONF_FEED_IN_ENERGY = "feed_in_energy_sensor"  # single, energy (kWh)
CONF_STORAGE_IN_ENERGY = "storage_in_energy_sensors"  # list, optional, energy into storage
CONF_STORAGE_OUT_ENERGY = "storage_out_energy_sensors"  # list, optional, energy from storage
CONF_STORAGE_COMBINED_ENERGY = "storage_combined_energy_sensors"  # list, optional, in and out in one sensor
CONF_INVERT_STORAGE_COMBINED = "invert_storage_combined"  # default: + = from storage, - = into storage

CONF_PRODUCTION_POWER = "production_power_sensors"  # list, power (W)
CONF_FEED_IN_POWER = "feed_in_power_sensor"  # single, power (W)
CONF_STORAGE_IN_POWER = "storage_in_power_sensors"  # list, optional, power into storage
CONF_STORAGE_OUT_POWER = "storage_out_power_sensors"  # list, optional, power from storage
CONF_STORAGE_COMBINED_POWER = "storage_combined_power_sensors"  # list, optional, in and out in one sensor
CONF_INVERT_STORAGE_COMBINED_POWER = "invert_storage_combined_power"  # default: + = from storage, - = into storage

CONF_INVERT_FEED_IN_POWER = "invert_feed_in_power"  # feed-in power sensor reports feed-in as negative values

CONF_ABS_STORAGE_POWER = "abs_storage_power"  # storage in/out power sensors report their direction as negative values (use the magnitude)

CONF_FORECAST_TODAY = "forecast_today_energy_sensors"  # list, optional, forecast energy for today (kWh)
CONF_FORECAST_TOMORROW = "forecast_tomorrow_energy_sensors"  # list, optional, forecast energy for tomorrow (kWh)
CONF_FORECAST_REMAINING = "forecast_remaining_energy_sensors"  # list, optional, forecast energy for the rest of today (kWh)

CONF_RESET_CONFIRM_MINUTES = "reset_confirm_minutes"  # energy filter: minutes a lower value must persist
DEFAULT_RESET_CONFIRM_MINUTES = 10

SETTINGS_STORE_KEY = "pv_assistant.settings"
SETTINGS_STORE_VERSION = 1
MAX_NAME_LENGTH = 60
MAX_PEAK_W = 10_000_000

PANEL_URL = "pv-assistant"
PANEL_ELEMENT = "pv-assistant-panel"
STATIC_URL = "/pv_assistant_static"
