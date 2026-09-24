from datetime import date, timedelta

FUTURE = date.today() + timedelta(days=30)
PAST = date.today() - timedelta(days=2)


def post(client, path, payload):
    return client.post(path, json=payload)


def test_empty_message_rejected(make_client):
    client, _, _ = make_client([])
    assert post(client, "/api/chat", {"message": ""}).status_code == 422


def test_whitespace_message_rejected(make_client):
    client, _, _ = make_client([])
    assert post(client, "/api/chat", {"message": "    "}).status_code == 422


def test_too_long_message_rejected(make_client):
    client, _, _ = make_client([])
    assert post(client, "/api/chat", {"message": "a" * 1001}).status_code == 422


def test_missing_message_rejected(make_client):
    client, _, _ = make_client([])
    assert post(client, "/api/chat", {}).status_code == 422


def test_validation_error_body_is_structured(make_client):
    client, _, _ = make_client([])
    body = post(client, "/api/chat", {"message": ""}).json()
    assert body["error"] == "validation_error" and body["request_id"] and body["detail"]


def test_form_with_past_date_rejected(make_client):
    client, _, _ = make_client([])
    payload = {"message": "x", "availability": {"check_in": PAST.isoformat(),
                                                "check_out": FUTURE.isoformat(), "adults": 2}}
    r = post(client, "/api/chat", payload)
    assert r.status_code == 422 and "past" in r.json()["detail"]


def test_form_checkout_before_checkin_rejected(make_client):
    client, _, _ = make_client([])
    payload = {"message": "x", "availability": {"check_in": FUTURE.isoformat(),
                                                "check_out": (FUTURE - timedelta(days=1)).isoformat(), "adults": 2}}
    assert post(client, "/api/chat", payload).status_code == 422


def test_form_zero_guests_rejected(make_client):
    client, _, _ = make_client([])
    payload = {"message": "x", "availability": {"check_in": FUTURE.isoformat(),
                                                "check_out": (FUTURE + timedelta(days=1)).isoformat(), "adults": 0}}
    assert post(client, "/api/chat", payload).status_code == 422


def test_availability_endpoint_ok(make_client):
    client, _, _ = make_client([])
    r = post(client, "/api/availability", {"check_in": FUTURE.isoformat(),
                                           "check_out": (FUTURE + timedelta(days=3)).isoformat(), "adults": 2})
    assert r.status_code == 200 and r.json()["nights"] == 3


def test_availability_endpoint_invalid(make_client):
    client, _, _ = make_client([])
    r = post(client, "/api/availability", {"check_in": PAST.isoformat(),
                                           "check_out": FUTURE.isoformat(), "adults": 2})
    assert r.status_code == 422


def test_health(make_client):
    client, _, _ = make_client([])
    assert client.get("/api/health").json() == {"status": "ok"}


def test_hotel_info(make_client):
    client, _, _ = make_client([])
    body = client.get("/api/hotel").json()
    assert body["name"] and body["max_guests_per_room"] == 4