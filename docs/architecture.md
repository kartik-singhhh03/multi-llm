# Architecture

Phase 1 established a split frontend/backend foundation. Phase 2 added isolated LLM provider adapters. Phase 3 added concurrent comparison through `POST /api/chat/compare`. Phase 4 added in-memory sessions and independent conversation history per model. Phase 5 wires the React UI to those APIs so a user can compare answers side-by-side and continue with one model.

## Current System

```
User
  |
  v
React Frontend  (Vite + TypeScript + Tailwind CSS)
  |
  | HTTP  GET /health
  | HTTP  POST /api/session
  | HTTP  DELETE /api/session/{session_id}
  | HTTP  POST /api/chat/compare
  | HTTP  POST /api/chat/continue
  v
FastAPI Backend
  |
  +--> SessionManager (in-memory)
  |
  +--> LLMOrchestrator
         |
         +--> OpenAI Provider
         +--> Claude Provider
         +--> Gemini Provider
```

The React UI uses `GET /health` for the connection indicator, `POST /api/chat/compare` for side-by-side answers, and `POST /api/chat/continue` after the user picks a model. API keys stay on the backend.

The backend is a FastAPI app with:

- explicit CORS origins for the Vite development server
- environment-based configuration, including provider keys and model names
- `GET /health`
- `POST /api/session` and `DELETE /api/session/{session_id}`
- `POST /api/chat/compare` and `POST /api/chat/continue`
- independent OpenAI, Claude, and Gemini histories per session
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

### Why the endpoint was stateless in Phase 3

Phase 3 `POST /api/chat/compare` accepted a prompt and returned a comparison with no stored history. Phase 4 adds session state around that same orchestrator.

## Phase 4 — Session and Conversation History

Phase 4 introduces `SessionManager`. Each chat session keeps three independent transcripts: OpenAI, Claude, and Gemini.

```
                    Chat Session
                        |
        +---------------+---------------+
        |               |               |
        v               v               v
     OpenAI          Claude          Gemini
     History         History         History
        |               |               |
        v               v               v
     Provider         Provider        Provider
```

### Why session state exists

Follow-up questions need previous turns. Without a session, every request would be a brand-new one-shot prompt and "Continue with this model" could not work.

### Why each model has an independent history

The three models give different answers. If Claude later explains a C++ example, that text belongs only in Claude's context. Sending Claude's answer to OpenAI would mix voices and leak another model's reasoning into the next prompt.

### Compare behavior

```
                  New Prompt
                       |
                       v
             +---------+---------+
             |         |         |
             v         v         v
          OpenAI    Claude     Gemini
          history   history    history
             |         |         |
             +---------+---------+
                       |
                       v
                  3 responses
```

The same user prompt is appended to all three histories. Then `LLMOrchestrator` calls the three providers concurrently, each with **only** that provider's messages. A successful assistant reply is appended only to that provider. A failed provider keeps the user turn and does not get a fake assistant error message.

If `session_id` is omitted, compare creates a session. If a session ID is supplied and missing, the API returns HTTP 404.

### Continue behavior

```
                  New Prompt
                       |
                       v
                 Claude History
                       |
                       v
                 Claude Provider
                       |
                       v
                    Response
```

`POST /api/chat/continue` with `model=claude` appends the follow-up only to Claude, calls Claude once, and leaves OpenAI and Gemini unchanged.

### Why provider-specific message conversion remains inside providers

Session history stores normalized `Message` objects (`system` / `user` / `assistant`). OpenAI, Anthropic, and Gemini still convert those messages inside their own provider modules. The session layer never sees vendor SDK types.

### Why Phase 4 uses in-memory storage

This is an academic prototype. A process-local dictionary is enough to prove independent histories and continuation. No Redis, SQLAlchemy, or database driver is required.

### What happens when the server restarts

All sessions disappear. State is also not shared across multiple backend processes. That is expected for this phase.

### How Redis or a database could replace SessionManager later

Keep the `SessionManager` method signatures (`create_session`, `get_history`, `append_message`, ...). Swap the dict for Redis lists or SQL rows. `Message`, providers, and HTTP routes would not need to change.

## Phase 5 — Frontend Integration

Phase 5 connects the React frontend to FastAPI. The browser never calls OpenAI, Anthropic, or Gemini directly.

```
User
 |
 v
React UI
 |
 v
FastAPI
 |
 +---- OpenAI
 +---- Claude
 +---- Gemini
 |
 v
Comparison results
 |
 v
Side-by-side cards
 |
 v
Selected model
 |
 v
Continue endpoint
```

### What the UI does

- `GET /health` shows **Backend Connected** or **Backend Offline**.
- The first prompt calls `POST /api/chat/compare` (no `session_id`). FastAPI creates a session.
- Results render as OpenAI, Claude, then Gemini cards: provider, model, response, latency, status.
- **Continue with this model** switches to continuation mode and later follow-ups call `POST /api/chat/continue` with `model` set to `openai`, `claude`, or `gemini`.
- The same `session_id` is kept in React state for that conversation.
- **New Comparison** clears the UI and drops the stored session ID so the next prompt starts a new session.
- Partial provider failures stay on their own card. Missing API keys show a configuration error, not fake answers.

API keys remain backend-only. There is still no authentication, database, Redis, streaming, or RAG.

## Phase 6 — Frontend UI Polish

Phase 6 is a visual and usability pass on the existing React UI. Compare, continue, and session behavior are unchanged. The layout was tightened for a clearer header, prompt, side-by-side cards, and continue-with-one-model flow on mobile, tablet, and desktop.

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
