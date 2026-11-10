from datetime import timedelta

from homeassistant.components.recorder.statistics import async_import_statistics
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.components.recorder.common import async_wait_recording_done

from custom_components.pv_assistant.insight import _read_statistics


async def test_read_statistics_from_a_real_recorder(recorder_mock, hass):
    """The recorder call (signature, units, row format) works against the real recorder, not only against a mock."""
    start = dt_util.start_of_local_day() - timedelta(days=1)
    rows = [{"start": dt_util.as_utc(start + timedelta(hours=h)), "state": 10 + h * 0.5, "sum": 10 + h * 0.5} for h in range(24)]
    metadata = {"source": "recorder", "statistic_id": "sensor.e_prod", "unit_of_measurement": "kWh", "has_mean": False, "has_sum": True, "name": "e", "mean_type": 0, "unit_class": "energy"}
    try:
        async_import_statistics(hass, metadata, rows)
    except TypeError:  # an older metadata layout
        metadata.pop("mean_type"); metadata.pop("unit_class")
        async_import_statistics(hass, metadata, rows)
    await async_wait_recording_done(hass)
    stats = await _read_statistics(hass, ["sensor.e_prod"], start - timedelta(hours=1), dt_util.now())
    got = sorted(stats["sensor.e_prod"])
    assert len(got) == 24 and all(t.tzinfo is not None for t, _ in got)
    # the hourly change of the counter; the first hour has no earlier row and carries the whole counter, which plausible_hours drops
    assert got[0][1] == 10.0 and all(abs(v - 0.5) < 1e-6 for _, v in got[1:])
