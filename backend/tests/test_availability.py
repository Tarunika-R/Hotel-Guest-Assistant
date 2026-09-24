from datetime import date, timedelta

import pytest

from app.services.availability import check_availability
from app.services.knowledge import build_context, max_capacity

CHECK_IN = date.today() + timedelta(days=30)
CHECK_OUT = CHECK_IN + timedelta(days=2)


def test_returns_options_sorted_by_price():
    res = check_availability(CHECK_IN, CHECK_OUT, 2)
    prices = [o.price_per_night for o in res.options]
    assert prices == sorted(prices)
    assert res.nights == 2


def test_total_price_is_nights_times_rate():
    res = check_availability(CHECK_IN, CHECK_OUT, 2)
    for o in res.options:
        assert o.total_price == o.price_per_night * 2


def test_capacity_filter_excludes_small_rooms():
    res = check_availability(CHECK_IN, CHECK_OUT, 3)
    assert all(o.capacity >= 3 for o in res.options)


def test_too_many_guests_returns_no_options():
    res = check_availability(CHECK_IN, CHECK_OUT, max_capacity() + 1)
    assert res.options == []


def test_deterministic_for_same_input():
    assert check_availability(CHECK_IN, CHECK_OUT, 2) == check_availability(CHECK_IN, CHECK_OUT, 2)


def test_rejects_past_dates():
    with pytest.raises(ValueError):
        check_availability(date.today() - timedelta(days=1), CHECK_OUT, 2)


def test_rejects_checkout_before_checkin():
    with pytest.raises(ValueError):
        check_availability(CHECK_OUT, CHECK_IN, 2)


def test_rejects_zero_guests():
    with pytest.raises(ValueError):
        check_availability(CHECK_IN, CHECK_OUT, 0)


def test_context_contains_key_facts():
    ctx = build_context()
    assert "3:00 PM" in ctx and "Swimming pool" in ctx and "Family Suite" in ctx