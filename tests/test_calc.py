import custom_components.pv_assistant  # noqa: F401
import custom_components.pv_assistant.config_flow  # noqa: F401
from unittest.mock import AsyncMock, MagicMock, patch

from homeassistant import config_entries
from homeassistant.helpers.dispatcher import async_dispatcher_send
from custom_components.pv_assistant.config_flow import PVAssistantConfigFlow
from pytest_homeassistant_custom_component.common import MockConfigEntry

DOMAIN = "pv_assistant"


def put(hass, eid, value, unit):
    hass.states.async_set(eid, str(value), {"unit_of_measurement": unit, "friendly_name": eid.split(".")[1]})


async def setup(hass, data):
    entry = MockConfigEntry(domain=DOMAIN, data=data, entry_id="e1", version=3)
    entry.add_to_hass(hass)
    hass.http = MagicMock(async_register_static_paths=AsyncMock())
    with patch.dict(config_entries.HANDLERS, {DOMAIN: PVAssistantConfigFlow}), patch("custom_components.pv_assistant.panel_custom.async_register_panel", AsyncMock()), patch(
        "custom_components.pv_assistant.websocket_api.async_register_command"
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    return entry


def val(hass, suffix):
    states = [s for s in hass.states.async_all("sensor") if s.entity_id.endswith(suffix)]
    assert states, (suffix, [s.entity_id for s in hass.states.async_all("sensor")])
    return states[0]


async def test_all(hass):
    hass.config.currency = "EUR"
    for p, v in (("a", 1000), ("b", 500), ("c", 300)):
        put(hass, f"sensor.p_{p}", v, "W")
    put(hass, "sensor.e_prod", 100, "kWh"); put(hass, "sensor.feed", 40, "kWh"); put(hass, "sensor.imp", 10, "kWh")
    put(hass, "sensor.house", 500, "kWh"); put(hass, "sensor.sin", 20, "kWh"); put(hass, "sensor.sout", 15, "kWh")
    put(hass, "sensor.soc", 60, "%"); put(hass, "sensor.fc", 30, "kWh")
    data = {
        "production_power_sensors": ["sensor.p_a", "sensor.p_b", "sensor.p_c"],
        "production_energy_sensors": ["sensor.e_prod"], "feed_in_energy_sensor": "sensor.feed",
        "grid_import_energy_sensors": ["sensor.imp"], "house_energy_sensors": ["sensor.house"],
        "storage_in_energy_sensors": ["sensor.sin"], "storage_out_energy_sensors": ["sensor.sout"],
        "battery_soc_sensor": "sensor.soc", "forecast_today_energy_sensors": ["sensor.fc"],
    }
    entry = await setup(hass, data)
    hass.data[DOMAIN]["settings"] = {
        "strings": {"sensor.p_a": {"peak": 2000}, "sensor.p_b": {"peak": 1000}, "sensor.p_c": {"peak": 800, "name": "Balkon"}},
        "inverters": [{"name": "Alpha", "max_w": 3000, "sensors": ["sensor.p_a", "sensor.p_b"]}],
        "general": {"price_import": 0.3, "price_feed_in": 0.1, "storage_capacity_kwh": 10, "battery_min_soc": 10},
    }
    async_dispatcher_send(hass, f"{DOMAIN}_settings_updated")
    await hass.async_block_till_done()
    assert float(val(hass, "pv_power").state) == 1800
    assert abs(float(val(hass, "pv_effective_power").state) - 1800 / 3800 * 100) < 0.01
    assert abs(float(val(hass, "storage_usable_energy").state) - 5.0) < 0.001
    # plants
    pa = hass.states.get("sensor.pv_assistant_p_a_power")
    pb = hass.states.get("sensor.pv_assistant_p_b_power")
    pc = hass.states.get("sensor.pv_assistant_p_c_power")
    assert float(pa.state) == 1500 and pb.state == "unavailable" and float(pc.state) == 300
    assert abs(float(hass.states.get("sensor.pv_assistant_p_a_effective_power").state) - 50) < 0.01
    # day values: counters grow
    put(hass, "sensor.e_prod", 110, "kWh"); put(hass, "sensor.feed", 44, "kWh"); put(hass, "sensor.imp", 12, "kWh")
    put(hass, "sensor.house", 510, "kWh"); put(hass, "sensor.sin", 23, "kWh"); put(hass, "sensor.sout", 18, "kWh")
    put(hass, "sensor.fc", 30, "kWh")
    await hass.async_block_till_done()
    assert float(val(hass, "production_today").state) == 10
    assert float(val(hass, "feed_in_today").state) == 4
    assert abs(float(val(hass, "self_consumption_rate_today").state) - 60) < 0.01
    assert abs(float(val(hass, "self_sufficiency_today").state) - 80) < 0.01   # house +10, imp +2
    assert abs(float(val(hass, "savings_today").state) - 6 * 0.3) < 0.01
    assert abs(float(val(hass, "feed_in_revenue_today").state) - 0.4) < 0.01
    assert abs(float(val(hass, "benefit_today").state) - 2.2) < 0.01
    assert abs(float(val(hass, "forecast_reached_today").state) - 10 / 30 * 100) < 0.01
    assert val(hass, "benefit_today").attributes["unit_of_measurement"] == "EUR"
    assert val(hass, "production_today").attributes["last_reset"]
    # unit conversion: Wh counter
    put(hass, "sensor.e_prod", 110000 + 2000, "Wh")
    await hass.async_block_till_done()
    # fault sensor still works with plants
    assert hass.states.get("binary_sensor.pv_assistant_plant_fault") is not None
    # unload cleanly
    assert await hass.config_entries.async_unload(entry.entry_id)


async def test_rollover_and_reset(hass):
    put(hass, "sensor.p_a", 500, "W")
    put(hass, "sensor.e_prod", 100, "kWh"); put(hass, "sensor.feed", 40, "kWh")
    data = {"production_power_sensors": ["sensor.p_a"], "production_energy_sensors": ["sensor.e_prod"], "feed_in_energy_sensor": "sensor.feed"}
    entry = await setup(hass, data)
    put(hass, "sensor.e_prod", 108, "kWh"); put(hass, "sensor.feed", 43, "kWh")
    await hass.async_block_till_done()
    assert float(val(hass, "production_today").state) == 8
    # a new day: the counters at that moment become the new start values
    counters = hass.data[DOMAIN]["daily"]
    counters._date = "2000-01-01"
    counters.midnight(None)
    await hass.async_block_till_done()
    assert float(val(hass, "production_today").state) == 0
    put(hass, "sensor.e_prod", 111, "kWh"); put(hass, "sensor.feed", 44, "kWh")
    await hass.async_block_till_done()
    assert float(val(hass, "production_today").state) == 3
    assert abs(float(val(hass, "self_consumption_rate_today").state) - (3 - 1) / 3 * 100) < 0.01
    # unavailable counter keeps the plausible value away: the sensor goes unknown instead of wrong
    hass.states.async_set("sensor.e_prod", "unavailable")
    await hass.async_block_till_done()
    assert await hass.config_entries.async_unload(entry.entry_id)
