from app.services.session_store import SessionStore


def test_stores_and_returns_history():
    s = SessionStore()
    s.append("a", "hi", "hello")
    assert s.get_history("a") == [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]


def test_sessions_are_isolated():
    s = SessionStore()
    s.append("a", "q1", "a1")
    assert s.get_history("b") == []


def test_trims_and_always_starts_with_user():
    s = SessionStore(max_messages=3)
    s.append("a", "q1", "a1")
    s.append("a", "q2", "a2")
    hist = s.get_history("a")
    assert hist[0]["role"] == "user" and len(hist) <= 3
    assert hist[-1]["content"] == "a2"


def test_expired_sessions_are_evicted():
    s = SessionStore(ttl_seconds=-1)  # everything is already expired
    s.append("a", "q", "a")
    assert s.get_history("a") == []