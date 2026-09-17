from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.api.chat import get_orchestrator
from app.core.config import get_settings
from app.main import app
from app.services.exceptions import ProviderTimeoutError
from app.services.orchestrator import LLMOrchestrator
from tests.test_orchestrator import FakeProvider, _factory_from


@pytest.fixture
def client() -> Iterator[TestClient]:
    providers = {
        "openai": FakeProvider("openai", model="gpt-4o-mini", content="openai-answer"),
        "claude": FakeProvider(
            "claude", model="claude-sonnet-4-5", content="claude-answer"
        ),
        "gemini": FakeProvider(
            "gemini", model="gemini-2.5-flash", content="gemini-answer"
        ),
    }
    orchestrator = LLMOrchestrator(provider_factory=_factory_from(providers))
    app.dependency_overrides[get_orchestrator] = lambda: orchestrator
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_compare_valid_prompt_returns_structured_success(client: TestClient) -> None:
    response = client.post(
        "/api/chat/compare",
        json={"prompt": "What is a binary tree?"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["prompt"] == "What is a binary tree?"
    assert payload["request_id"]
    assert payload["total_latency_ms"] >= 0
    assert len(payload["results"]) == 3
    assert [item["provider"] for item in payload["results"]] == [
        "openai",
        "claude",
        "gemini",
    ]
    assert payload["results"][0]["content"] == "openai-answer"
    assert payload["results"][1]["content"] == "claude-answer"
    assert payload["results"][2]["content"] == "gemini-answer"
    assert all(item["status"] == "success" for item in payload["results"])
    assert all(item["error"] is None for item in payload["results"])
    assert "OPENAI_API_KEY" not in response.text
    assert "ANTHROPIC_API_KEY" not in response.text
    assert "GEMINI_API_KEY" not in response.text


def test_compare_trims_prompt(client: TestClient) -> None:
    response = client.post(
        "/api/chat/compare",
        json={"prompt": "  Explain recursion simply  "},
    )
    assert response.status_code == 200
    assert response.json()["prompt"] == "Explain recursion simply"


def test_compare_partial_provider_failure_returns_http_200() -> None:
    providers = {
        "openai": FakeProvider("openai", content="openai-ok"),
        "claude": FakeProvider(
            "claude", raise_exc=ProviderTimeoutError("Anthropic Claude request timed out")
        ),
        "gemini": FakeProvider("gemini", content="gemini-ok"),
    }
    app.dependency_overrides[get_orchestrator] = lambda: LLMOrchestrator(
        provider_factory=_factory_from(providers)
    )
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/chat/compare",
                json={"prompt": "Explain hashing"},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["results"][0]["status"] == "success"
    assert payload["results"][1]["status"] == "error"
    assert payload["results"][1]["content"] is None
    assert payload["results"][1]["error"] == "Anthropic Claude request timed out"
    assert payload["results"][2]["status"] == "success"


def test_compare_empty_prompt_is_rejected(client: TestClient) -> None:
    response = client.post("/api/chat/compare", json={"prompt": ""})
    assert response.status_code == 422


def test_compare_whitespace_only_prompt_is_rejected(client: TestClient) -> None:
    response = client.post("/api/chat/compare", json={"prompt": "   \n\t  "})
    assert response.status_code == 422


def test_compare_missing_prompt_is_rejected(client: TestClient) -> None:
    response = client.post("/api/chat/compare", json={})
    assert response.status_code == 422


def test_compare_wrong_prompt_type_is_rejected(client: TestClient) -> None:
    response = client.post("/api/chat/compare", json={"prompt": 123})
    assert response.status_code == 422


def test_compare_excessively_long_prompt_is_rejected(client: TestClient) -> None:
    too_long = "a" * (get_settings().max_prompt_length + 1)
    response = client.post("/api/chat/compare", json={"prompt": too_long})
    assert response.status_code == 422


def test_compare_missing_keys_return_structured_errors() -> None:
    from app.core.config import Settings
    from app.services.factory import get_provider

    settings = Settings.model_construct(
        openai_api_key="",
        openai_model="gpt-4o-mini",
        anthropic_api_key="",
        anthropic_model="claude-sonnet-4-5",
        gemini_api_key="",
        gemini_model="gemini-2.5-flash",
        llm_timeout_seconds=30.0,
        llm_max_output_tokens=256,
    )

    app.dependency_overrides[get_orchestrator] = lambda: LLMOrchestrator(
        provider_factory=lambda name: get_provider(name, settings)
    )
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/chat/compare",
                json={"prompt": "Explain recursion in simple terms."},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert [item["provider"] for item in payload["results"]] == [
        "openai",
        "claude",
        "gemini",
    ]
    assert all(item["status"] == "error" for item in payload["results"])
    assert all(item["content"] is None for item in payload["results"])
    assert "not configured" in payload["results"][0]["error"].lower()
    assert "not configured" in payload["results"][1]["error"].lower()
    assert "not configured" in payload["results"][2]["error"].lower()


def test_openapi_includes_compare_endpoint(client: TestClient) -> None:
    spec = client.get("/openapi.json").json()
    assert "/api/chat/compare" in spec["paths"]
    assert "post" in spec["paths"]["/api/chat/compare"]

