# Architecture

Phase 1 established a split frontend/backend foundation. Phase 2 added isolated LLM provider adapters. Phase 3 adds concurrent comparison through `POST /api/chat/compare`. Conversation history and the frontend comparison UI are still later phases.

## Current System

```
User
  |
  v
React Frontend  (Vite + TypeScript + Tailwind CSS)
  |
  | HTTP  GET /health
  | HTTP  POST /api/chat/compare
  v
FastAPI Backend
  |
  +--> LLMOrchestrator
         |
         +--> OpenAI Provider
         +--> Claude Provider
         +--> Gemini Provider
```

The frontend still uses `GET /health` for the landing-page connection indicator. The comparison endpoint is available on the backend; the side-by-side chat UI is not implemented yet.

The backend is a FastAPI app with:

- explicit CORS origins for the Vite development server
- environment-based configuration, including provider keys and model names
- `GET /health`
- `POST /api/chat/compare`
- isolated OpenAI, Claude, and Gemini provider adapters
- concurrent orchestration with failure isolation

## Phase 2 — LLM Provider Architecture

Phase 2 adds a common provider interface. Each vendor SDK is isolated behind that interface.

```
User prompt
    |
    v
BaseLLMProvider.generate(messages)
    |
    +---- OpenAIProvider
    |
    +---- ClaudeProvider
    |
    +---- GeminiProvider
    |
    v
Normalized LLMResponse
```

### Why a common provider interface exists

OpenAI, Anthropic, and Gemini expose different clients, request shapes, and error types. The rest of the backend should not need to know those details. `BaseLLMProvider` gives every vendor the same async method:

```python
response = await get_provider("openai").generate(messages)
```

The same call works for `"claude"` and `"gemini"`.

### Why provider-specific SDK code is isolated

SDK imports, request conversion, and exception mapping live only in:

- `backend/app/services/openai_provider.py`
- `backend/app/services/claude_provider.py`
- `backend/app/services/gemini_provider.py`

If Anthropic changes how system prompts are sent, only the Claude provider changes. FastAPI routes and (later) orchestration stay on `Message` and `LLMResponse`.

### Why normalized responses are used

Each provider returns the same object:

- `provider`
- `model`
- `content`
- `status`
- `latency_ms`
- `error`

Success and failure use that same shape. The orchestrator collects three `LLMResponse` objects without translating vendor payloads.

### Why API keys remain server-side

Provider credentials are loaded from backend environment variables. They are never sent to the React app, never returned by an endpoint, and never written into logs. Missing keys do not prevent FastAPI from starting; a later generate call returns a configuration error instead of a fake answer.

## Phase 3 — Parallel LLM Orchestration

Phase 3 adds `LLMOrchestrator` and `POST /api/chat/compare`. One prompt is sent to OpenAI, Claude, and Gemini at the same time.

```
                    POST /api/chat/compare
                              |
                              v
                       LLMOrchestrator
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
        OpenAIProvider   ClaudeProvider   GeminiProvider
             |                |                |
             +----------------+----------------+
                              |
                              v
                       CompareResponse
```

### Why orchestration exists

The API layer should not call each vendor SDK itself. The orchestrator asks the factory for three `BaseLLMProvider` instances, converts the prompt into a `Message`, and collects normalized `LLMResponse` objects. Provider SDKs stay hidden.

### How asyncio concurrency works

The orchestrator creates one coroutine per provider and awaits them together:

```python
results = await asyncio.gather(
    openai_provider.generate(messages),
    claude_provider.generate(messages),
    gemini_provider.generate(messages),
    return_exceptions=True,
)
```

`asyncio.gather` runs the three tasks on the event loop concurrently. It does not start Claude only after OpenAI has finished.

### Why providers run concurrently

A sequential implementation would add the three provider times together. Concurrent execution overlaps waiting on network I/O, so the user waits about as long as the slowest model.

### Why one provider failure does not fail the entire comparison

A comparison request is valid even if Claude times out or Gemini is missing an API key. `return_exceptions=True` plus normalized error `LLMResponse` objects keep successful providers in the payload. The endpoint still returns HTTP 200. Unexpected bugs in the orchestrator itself still surface as HTTP 500.

### Why total latency is based on wall-clock duration

`total_latency_ms` is measured with a monotonic clock around the gather call. It is the elapsed time of the comparison, not `openai_latency + claude_latency + gemini_latency`. Individual `latency_ms` values remain on each provider result.

### How normalized LLMResponse objects simplify the frontend

The future UI can render `results[0]`, `results[1]`, and `results[2]` with the same fields: `provider`, `model`, `content`, `status`, `latency_ms`, and `error`. It does not need OpenAI, Anthropic, or Gemini response shapes. Results are always in that order, even if Gemini finishes first.

### Why the endpoint is stateless in Phase 3

`POST /api/chat/compare` accepts a prompt and returns a comparison. Nothing is stored: no sessions, chat IDs, users, database rows, or Redis keys. Continuation and independent histories belong to a later phase.

## Target Architecture

```
User
  |
  v
React Frontend
  |
  | HTTP
  v
FastAPI Backend
  |
  +--> OpenAI Provider
  |
  +--> Claude Provider
  |
  +--> Gemini Provider
```

API keys remain on the backend only. The browser never receives provider secrets.

The frontend still only uses `GET /health` for the landing page. `POST /api/chat/compare` is implemented on the backend; the side-by-side comparison UI is not built yet.

## Planned Later-Phase Behavior

Later phases will add:

- **Independent model histories:** each model keeps its own conversation transcript.
- **Continuation with a selected model:** after comparing answers, the user can continue only with the chosen model.
- **Frontend comparison UI:** side-by-side cards that render `POST /api/chat/compare` results.

Those capabilities are not part of Phase 3.
