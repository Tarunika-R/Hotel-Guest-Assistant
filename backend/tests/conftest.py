import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.llm_client import FakeLLM, get_llm_client
from app.services.session_store import SessionStore, get_session_store


@pytest.fixture
def make_client():
    """Returns (client, fake_llm, session_store) wired with a scripted LLM."""

    def _make(script: list):
        llm = FakeLLM(script)
        store = SessionStore()
        app.dependency_overrides[get_llm_client] = lambda: llm
        app.dependency_overrides[get_session_store] = lambda: store
        return TestClient(app, raise_server_exceptions=False), llm, store

    yield _make
    app.dependency_overrides.clear()