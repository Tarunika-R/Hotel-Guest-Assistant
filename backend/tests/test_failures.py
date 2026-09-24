from app.main import app
from app.services.llm_client import (
    LLMTimeout, LLMUnavailable, UnconfiguredLLM, get_llm_client, text_response,
)


def chat(client, message="hello", **extra):
    return client.post("/api/chat", json={"message": message, **extra})


def test_model_timeout_returns_friendly_error(make_client):
    client, _, _ = make_client([LLMTimeout("slow")])
    r = chat(client)
    assert r.status_code == 200
    body = r.json()
    assert body["type"] == "error"
    assert "longer than usual" in body["message"]


def test_model_unavailable_points_to_front_desk(make_client):
    client, _, _ = make_client([LLMUnavailable("down")])
    body = chat(client).json()
    assert body["type"] == "error"
    assert "+91 832 555 0100" in body["message"]


def test_missing_api_key_degrades_gracefully(make_client):
    client, _, _ = make_client([])
    app.dependency_overrides[get_llm_client] = lambda: UnconfiguredLLM()
    body = chat(client).json()
    assert body["type"] == "error"


def test_failed_turn_is_not_saved_to_history(make_client):
    client, llm, _ = make_client([LLMTimeout("slow"), text_response("Check-in is 3 PM.")])
    first = chat(client, "What time is check-in?").json()
    chat(client, "What time is check-in?", session_id=first["session_id"])
    assert len(llm.calls[1]["messages"]) == 1  # only the new user message


def test_unexpected_bug_returns_structured_500(make_client):
    client, _, _ = make_client([RuntimeError("boom")])
    r = chat(client)
    assert r.status_code == 500
    body = r.json()
    assert body["error"] == "internal_error"
    assert body["request_id"]
    assert "boom" not in r.text  # no internals leaked