from fastapi import APIRouter, Depends

from app.schemas.chat import CompareRequest, CompareResponse
from app.services.orchestrator import LLMOrchestrator

router = APIRouter(prefix="/chat", tags=["chat"])


def get_orchestrator() -> LLMOrchestrator:
    return LLMOrchestrator()


@router.post(
    "/compare",
    response_model=CompareResponse,
    summary="Compare LLM responses",
    description=(
        "Send one prompt to OpenAI, Claude, and Gemini at the same time. "
        "The comparison request returns HTTP 200 even if individual providers "
        "fail. Total latency is wall-clock orchestration time, not the sum of "
        "provider latencies."
    ),
)
async def compare_prompt(
    payload: CompareRequest,
    orchestrator: LLMOrchestrator = Depends(get_orchestrator),
) -> CompareResponse:
    outcome = await orchestrator.compare(payload.prompt)
    return CompareResponse.model_validate(outcome.model_dump())
