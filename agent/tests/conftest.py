import os
import pytest
from app.config import settings


@pytest.fixture(autouse=True)
def default_mock_settings(monkeypatch):
    """Ensure unit tests default to deterministic in-memory fixtures unless explicitly overridden."""
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.setattr(settings, "llm_provider", "mock")
    monkeypatch.setattr(settings, "retrieval_mode", "mock")
    monkeypatch.setattr(settings, "use_mock_api", True)
