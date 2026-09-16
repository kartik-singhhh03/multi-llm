from types import SimpleNamespace

import anthropic
import httpx
import pytest

from app.services.claude_provider import ClaudeProvider, to_claude_payload
from app.services.models import Message, MessageRole, ResponseStatus


def test_claude_separates_system_from_conversation() -> None:
    system_instruction, conversation = to_claude_payload(
        [
            Message(role=MessageRole.SYSTEM, content="Answer briefly."),
            Message(role=MessageRole.USER, content="What is 2+2?"),
            Message(role=MessageRole.ASSISTANT, content="4"),
            Message(role=MessageRole.USER, content="And 3+3?"),
        ]
    )
    assert system_instruction == "Answer briefly."
    assert conversation == [
        {"role": "user", "content": "What is 2+2?"},
        {"role": "assistant", "content": "4"},
        {"role": "user", "content": "And 3+3?"},
    ]
    assert all(item["role"] != "system" for item in conversation)


def test_claude_joins_multiple_system_messages() -> None:
    system_instruction, conversation = to_claude_payload(
        [
            Message(role=MessageRole.SYSTEM, content="Be kind."),
            Message(role=MessageRole.SYSTEM, content="Be brief."),
            Message(role=MessageRole.USER, content="Hi"),
        ]
    )
    assert system_instruction == "Be kind.\n\nBe brief."
    assert conversation == [{"role": "user", "content": "Hi"}]


@pytest.mark.asyncio
async def test_claude_missing_api_key_returns_error() -> None:
    provider = ClaudeProvider(
        api_key="  ",
        model="claude-sonnet-4-5",
        timeout_seconds=30,
        max_output_tokens=256,
        client=_fake_claude_client("should not be called"),
    )
    response = await provider.generate(
        [Message(role=MessageRole.USER, content="Hello")]
    )
    assert response.status == ResponseStatus.ERROR
    assert response.error == "Anthropic Claude API key is not configured"
    assert response.content is None
    assert response.latency_ms >= 0


@pytest.mark.asyncio
async def test_claude_success_sends_system_parameter() -> None:
    client = _fake_claude_client("Claude answer")
    provider = ClaudeProvider(
        api_key="anthropic-test",
        model="claude-sonnet-4-5",
        timeout_seconds=30,
        max_output_tokens=256,
        client=client,
    )
    response = await provider.generate(
        [
            Message(role=MessageRole.SYSTEM, content="Stay concise."),
            Message(role=MessageRole.USER, content="Hello"),
        ]
    )
    assert response.status == ResponseStatus.SUCCESS
    assert response.content == "Claude answer"
    assert response.provider == "claude"
    assert client.messages.last_kwargs["system"] == "Stay concise."
    assert client.messages.last_kwargs["messages"] == [
        {"role": "user", "content": "Hello"}
    ]
    assert "system" not in [
        item["role"] for item in client.messages.last_kwargs["messages"]
    ]


@pytest.mark.asyncio
async def test_claude_sdk_failure_is_safe_application_error() -> None:
    client = _fake_claude_client_error(_anthropic_status_error(anthropic.RateLimitError))
    provider = ClaudeProvider(
        api_key="anthropic-test",
        model="claude-sonnet-4-5",
        timeout_seconds=30,
        max_output_tokens=256,
        client=client,
    )
    response = await provider.generate(
        [Message(role=MessageRole.USER, content="Hello")]
    )
    assert response.status == ResponseStatus.ERROR
    assert response.error == "Anthropic Claude rate limit exceeded"
    assert "anthropic-test" not in (response.error or "")


class _FakeMessages:
    def __init__(self, text: str | None = None, error: Exception | None = None) -> None:
        self.text = text
        self.error = error
        self.last_kwargs: dict[str, object] = {}

    async def create(self, **kwargs: object) -> object:
        self.last_kwargs = kwargs
        if self.error is not None:
            raise self.error
        return SimpleNamespace(content=[SimpleNamespace(text=self.text)])


class _FakeClaudeClient:
    def __init__(self, messages: _FakeMessages) -> None:
        self.messages = messages


def _fake_claude_client(text: str) -> _FakeClaudeClient:
    return _FakeClaudeClient(_FakeMessages(text=text))


def _fake_claude_client_error(error: Exception) -> _FakeClaudeClient:
    return _FakeClaudeClient(_FakeMessages(error=error))


def _anthropic_status_error(
    error_cls: type[anthropic.APIStatusError],
) -> anthropic.APIStatusError:
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    response = httpx.Response(429, request=request)
    return error_cls("request failed", response=response, body=None)
