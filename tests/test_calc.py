import custom_components.pv_assistant  # noqa: F401
import custom_components.pv_assistant.config_flow  # noqa: F401
from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from homeassistant import config_entries
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.util import dt as dt_util
from custom_components.pv_assistant.config_flow import PVAssistantConfigFlow
from custom_components.pv_assistant.insight import best_window, feed_in_share, hourly_profile
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


# ---------------------------------------------------------------- look-ahead sensors (insight.py)

def test_profile_and_best_window():
    shape = [0.0] * 6 + [1, 2, 4, 6, 7, 9, 9, 8, 6, 4, 2, 1] + [0.0] * 6  # 06:00 ... 17:00
    hours = {f"2026-06-{d:02d}": [v * (1 + d % 3) for v in shape] for d in range(1, 8)}
    assert hourly_profile(hours, "2026-06-01") is None  # no complete past day
    profile, days = hourly_profile(hours, "2026-06-08")
    assert days == 7 and abs(sum(profile) - 1) < 1e-9 and profile[0] == 0
    start, energy = best_window(profile, 30.0)
    assert start == 11  # the hours 11, 12 and 13 hold 9 + 9 + 8 of the units of the day (10 to 12 would be 7 + 9 + 9)
    assert abs(energy - 30.0 * (9 + 9 + 8) / sum(shape)) < 1e-9
    assert hourly_profile({"2026-06-01": [1.0] * 24, "2026-06-02": [1.0] * 24}, "2026-06-08") is None  # only two days


def test_feed_in_share():
    days = {"2026-06-01": {"production": 20.0, "feed_in": 5.0}, "2026-06-02": {"production": 10.0, "feed_in": 5.0}, "2026-06-03": {"production": 0.0, "feed_in": 0.0}}
    share, n = feed_in_share(days, "2026-06-10")
    assert n == 2 and abs(share - 10 / 30) < 1e-9
    assert feed_in_share({}, "2026-06-10") is None


async def test_surplus_and_storage_empty(hass):
    put(hass, "sensor.feed_p", -1500, "W"); put(hass, "sensor.chg", 700, "W"); put(hass, "sensor.dis", 0, "W")
    put(hass, "sensor.soc", 50, "%")
    put(hass, "sensor.e_prod", 100, "kWh"); put(hass, "sensor.feed", 40, "kWh")
    data = {
        "production_energy_sensors": ["sensor.e_prod"], "feed_in_energy_sensor": "sensor.feed",
        "feed_in_power_sensor": "sensor.feed_p", "invert_feed_in_power": True,
        "storage_in_power_sensors": ["sensor.chg"], "storage_out_power_sensors": ["sensor.dis"], "battery_soc_sensor": "sensor.soc",
    }
    entry = await setup(hass, data)
    hass.data[DOMAIN]["settings"] = {"general": {"storage_capacity_kwh": 10, "battery_min_soc": 10}}
    async_dispatcher_send(hass, f"{DOMAIN}_settings_updated")
    await hass.async_block_till_done()
    surplus = val(hass, "pv_surplus_power")
    assert float(surplus.state) == 2200 and surplus.attributes["charging_power"] == 700  # fed in 1500 + charging 700
    assert val(hass, "storage_empty_at").state == "unknown"  # not discharging
    put(hass, "sensor.chg", 0, "W"); put(hass, "sensor.dis", 2000, "W")
    await hass.async_block_till_done()
    empty = dt_util.parse_datetime(val(hass, "storage_empty_at").state)
    # usable 10 kWh x (50 - 10) % = 4 kWh at 2 kW: 2 hours
    assert abs((empty - dt_util.utcnow()).total_seconds() - 7200) < 60
    assert await hass.config_entries.async_unload(entry.entry_id)


async def test_history_and_tomorrow_sensors(hass):
    put(hass, "sensor.e_prod", 100, "kWh"); put(hass, "sensor.feed", 40, "kWh"); put(hass, "sensor.fc_tom", 30, "kWh")
    data = {"production_energy_sensors": ["sensor.e_prod"], "feed_in_energy_sensor": "sensor.feed", "forecast_tomorrow_energy_sensors": ["sensor.fc_tom"]}
    entry = await setup(hass, data)
    history = hass.data[DOMAIN]["history"]
    assert val(hass, "expected_feed_in_tomorrow").state == "unknown" and val(hass, "best_window_tomorrow").state == "unknown"
    # a day ends: production 10, feed-in 4 -> 40 % is fed in
    counters = hass.data[DOMAIN]["daily"]
    put(hass, "sensor.e_prod", 110, "kWh"); put(hass, "sensor.feed", 44, "kWh")
    await hass.async_block_till_done()  # the filtered copies follow
    counters._date = (dt_util.now().date() - timedelta(days=1)).isoformat()
    counters.midnight(None)
    await hass.async_block_till_done()
    yesterday = (dt_util.now().date() - timedelta(days=1)).isoformat()
    assert history.days[yesterday] == {"production": 10.0, "feed_in": 4.0}
    assert abs(float(val(hass, "expected_feed_in_tomorrow").state) - 30 * 0.4) < 0.01
    # hours: the energy of the hour that just ended is stored under that hour
    t = dt_util.now().replace(minute=0, second=10, microsecond=0)
    put(hass, "sensor.e_prod", 110, "kWh")
    await hass.async_block_till_done()
    history.hour_mark(t - timedelta(hours=1))
    put(hass, "sensor.e_prod", 112.5, "kWh")
    await hass.async_block_till_done()
    history.hour_mark(t)
    ended = t - timedelta(hours=1)
    assert history.hours[ended.strftime("%Y-%m-%d")][ended.hour] == 2.5
    # three days of hours make a profile: the best window is where the production was
    for k in range(1, 4):
        day = (dt_util.now().date() - timedelta(days=k)).isoformat()
        history.hours[day] = [0.0] * 8 + [1, 3, 5, 5, 3, 1] + [0.0] * 10
    history._save()
    async_dispatcher_send(hass, "pv_assistant_history_updated")
    await hass.async_block_till_done()
    window = val(hass, "best_window_tomorrow")
    start = dt_util.as_local(dt_util.parse_datetime(window.state))
    assert start.hour == 9 and window.attributes["days"] >= 3  # the hours 9, 10 and 11 hold 3 + 5 + 5 units (the peak of the day)
    assert await hass.config_entries.async_unload(entry.entry_id)
