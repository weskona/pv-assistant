import pytest


@pytest.fixture(autouse=True)
def _custom():
    """The recorder tests set up the recorder before Home Assistant exists, so the parent fixture that needs hass is replaced."""
    yield
