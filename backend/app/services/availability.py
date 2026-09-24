from datetime import date, timedelta

from app.schemas import AvailabilityQuery, AvailabilityResult, RoomOption
from app.services.knowledge import get_rooms


def _booked(room_index: int, total_rooms: int, night: date) -> int:
    """Mock booking data: deterministic per (room, night), busier on Fri/Sat.
    Avoids Python's hash() because it is randomized between runs."""
    booked = (night.toordinal() * 7 + room_index * 3) % (total_rooms + 1)
    if night.weekday() in (4, 5):
        booked = min(total_rooms, booked + 2)
    return booked


def check_availability(check_in: date, check_out: date, adults: int) -> AvailabilityResult:
    """Mock availability tool. Raises ValueError (pydantic ValidationError) on bad input."""
    query = AvailabilityQuery(check_in=check_in, check_out=check_out, adults=adults)
    nights = (query.check_out - query.check_in).days

    options: list[RoomOption] = []
    for idx, room in enumerate(get_rooms()):
        if room["capacity"] < query.adults:
            continue
        max_booked = max(
            _booked(idx, room["total_rooms"], query.check_in + timedelta(days=d))
            for d in range(nights)
        )
        left = room["total_rooms"] - max_booked
        if left <= 0:
            continue
        options.append(RoomOption(
            room_id=room["id"],
            name=room["name"],
            capacity=room["capacity"],
            rooms_left=left,
            price_per_night=room["price_per_night"],
            total_price=room["price_per_night"] * nights,
            nights=nights,
            features=room["features"],
        ))

    options.sort(key=lambda o: o.price_per_night)
    return AvailabilityResult(
        check_in=query.check_in,
        check_out=query.check_out,
        adults=query.adults,
        nights=nights,
        options=options,
    )