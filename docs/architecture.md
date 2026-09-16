# Architecture

Phase 1 established a split frontend/backend foundation. Phase 2 adds isolated LLM provider adapters. Multi-LLM comparison is planned for later phases and is **not implemented yet**.

## Current System

```
User
  |
  v
React Frontend  (Vite + TypeScript + Tailwind CSS)
  |
  | HTTP  GET /health
  v
FastAPI Backend
```

The frontend is a React application. It talks to the FastAPI backend over HTTP. The live HTTP integration is still `GET /health`. LLM providers exist on the backend but are not exposed as chat/compare endpoints yet.

The backend is a FastAPI app with:

- explicit CORS origins for the Vite development server
- environment-based configuration, including provider keys and model names
- `GET /health`
- an `/api` prefix reserved for future endpoints
- isolated OpenAI, Claude, and Gemini provider adapters

## Phase 2 — LLM Provider Architecture

Phase 2 adds a common provider interface. Each vendor SDK is isolated behind that interface. Parallel comparison is still a later phase.

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

Success and failure use that same shape. Phase 3 can display or collect three results without translating three vendor payloads.

### Why API keys remain server-side

Provider credentials are loaded from backend environment variables. They are never sent to the React app, never returned by an endpoint, and never written into logs. Missing keys do not prevent FastAPI from starting; a later generate call returns a configuration error instead of a fake answer.

### How Phase 3 will add parallel execution

Phase 2 can call one provider at a time. Phase 3 will introduce an orchestrator that calls the three providers together, for example with `asyncio.gather`, and returns a side-by-side comparison. That orchestration is not implemented yet.

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

The frontend still only calls `GET /health` in this phase. Provider classes are used from backend tests and will be wired to HTTP in a later phase.

## Planned Later-Phase Behavior

Later phases will add:

- **Parallel LLM execution:** one prompt is forwarded to multiple providers at the same time.
- **Independent model histories:** each model keeps its own conversation transcript.
- **Continuation with a selected model:** after comparing answers, the user can continue only with the chosen model.

Those capabilities are not part of Phase 2.
