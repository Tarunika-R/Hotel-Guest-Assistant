import time
from collections import OrderedDict
from functools import lru_cache
from threading import Lock

from app.config import get_settings


class SessionStore:
    """In-memory conversation history (plain text turns). Swap for Redis in production."""

    def __init__(self, max_messages: int = 10, ttl_seconds: int = 3600, max_sessions: int = 1000):
        self.max_messages = max_messages
        self.ttl = ttl_seconds
        self.max_sessions = max_sessions
        self._data: OrderedDict[str, tuple[float, list[dict]]] = OrderedDict()
        self._lock = Lock()

    def _evict(self) -> None:
        now = time.time()
        while self._data:
            oldest_id, (ts, _) = next(iter(self._data.items()))
            if now - ts > self.ttl:
                self._data.pop(oldest_id)
            else:
                break

    def get_history(self, session_id: str) -> list[dict]:
        with self._lock:
            self._evict()
            entry = self._data.get(session_id)
            return list(entry[1]) if entry else []

    def append(self, session_id: str, user_text: str, assistant_text: str) -> None:
        with self._lock:
            self._evict()
            _, msgs = self._data.get(session_id, (0.0, []))
            msgs = msgs + [
                {"role": "user", "content": user_text},
                {"role": "assistant", "content": assistant_text},
            ]
            msgs = msgs[-self.max_messages:]
            if msgs and msgs[0]["role"] == "assistant":  # API requires starting with user
                msgs = msgs[1:]
            self._data[session_id] = (time.time(), msgs)
            self._data.move_to_end(session_id)
            while len(self._data) > self.max_sessions:
                self._data.popitem(last=False)


@lru_cache
def get_session_store() -> SessionStore:
    return SessionStore(max_messages=get_settings().max_history_messages)