from pydantic import BaseModel, Field, field_validator

from app.core.config import get_settings
from app.services.models import LLMResponse, ResponseStatus


class CompareRequest(BaseModel):
    """User prompt sent to OpenAI, Claude, and Gemini in parallel."""

    prompt: str = Field(
        ...,
        description="The question to send to all configured LLM providers.",
        examples=["Explain binary search to a beginner"],
    )

    @field_validator("prompt")
    @classmethod
    def normalize_prompt(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("prompt must not be empty")
        limit = get_settings().max_prompt_length
        if len(stripped) > limit:
            raise ValueError(f"prompt must be at most {limit} characters")
        return stripped


class ComparisonResult(LLMResponse):
    """Normalized result from a single LLM provider."""

    status: ResponseStatus = Field(
        description="success when the provider returned text, otherwise error."
    )


class CompareResponse(BaseModel):
    """Aggregate result of a concurrent multi-LLM comparison."""

    request_id: str = Field(
        description="Unique identifier for this comparison request."
    )
    prompt: str = Field(description="The normalized prompt that was compared.")
    results: list[ComparisonResult] = Field(
        description="Provider results in stable order: OpenAI, Claude, Gemini."
    )
    total_latency_ms: int = Field(
        ge=0,
        description=(
            "Wall-clock orchestration time in milliseconds. Because providers "
            "run concurrently, this is close to the slowest provider, not the "
            "sum of individual latencies."
        ),
    )
