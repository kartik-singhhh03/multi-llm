# Multi-LLM Custom ChatGPT

Academic project for the IIT Patna AI/ML program.

## 1. Project Overview

This repository is a ChatGPT-like application. A single user prompt can already be sent to OpenAI, Claude, and Gemini in parallel through the backend. Responses will later appear side by side in the UI, and the user will be able to continue the conversation with a selected model.

**The frontend comparison UI is not implemented yet.** Phase 1 established the structure and health check. Phase 2 added backend LLM provider adapters. Phase 3 adds concurrent comparison at `POST /api/chat/compare`.

## 2. Project Objective

Create a clean, professional, and extensible multi-LLM comparison chat application. The frontend and backend are separate applications that communicate over HTTP. Conversation history, authentication, and persistence are intentionally deferred.

## 3. Core Requirements

The finished application (across later phases) will:

- Send one user question to multiple LLMs in parallel
- Display responses in a side-by-side panel
- Allow the user to choose "Continue with this model"
- Keep an independent conversation history for each model

Those features are **planned**. The backend can already run the three providers concurrently. The side-by-side UI and conversation continuation are not implemented yet.

## 4. Planned Architecture

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

API keys will live only on the backend. The frontend will never call LLM providers directly.

See [docs/architecture.md](docs/architecture.md) for more detail.

## 5. Technology Stack

**Frontend**

- React
- TypeScript
- Vite
- Tailwind CSS

**Backend**

- Python 3.10+
- FastAPI
- Pydantic
- Uvicorn

**Package management**

- Frontend: npm
- Backend: Python venv + pip

## 6. Current Phase

Phase 1, Phase 2, and Phase 3 are complete.

Included now:

- FastAPI application with CORS for the Vite dev server
- `GET /health` endpoint
- React application shell with a live backend status indicator
- Backend provider abstraction for OpenAI, Anthropic Claude, and Google Gemini
- Normalized `Message` and `LLMResponse` models
- Provider factory: `get_provider("openai" | "claude" | "gemini")`
- Concurrent comparison through `LLMOrchestrator`
- `POST /api/chat/compare`
- Normalized results with provider failure isolation
- Wall-clock total latency (approximately the slowest provider)
- Environment-based API keys and model names
- Pytest coverage with mocked SDK clients (no paid API calls)

Not included yet:

- Frontend comparison UI
- Conversation history
- "Continue with this model"
- Authentication
- Database
- Redis
- Docker
- Streaming
- Mock or fake AI responses in the application

## 7. Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── core/
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   └── architecture.md
├── .gitignore
└── README.md
```

## 8. Local Setup

Prerequisites:

- Node.js 18+
- Python 3.10+
- npm

Clone or copy the project, then set up each application independently.

On some Windows machines, the Python launcher is `py` rather than `python`. Use whichever command is available on your PATH.

## 9. Running the Backend

```bash
cd backend
python -m venv .venv
```

Windows activation:

```bash
.venv\Scripts\activate
```

macOS / Linux activation:

```bash
source .venv/bin/activate
```

Install dependencies and start the server:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).

Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

Compare endpoint: `POST http://127.0.0.1:8000/api/chat/compare`

OpenAPI docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

Optional: copy `backend/.env.example` to `backend/.env` and fill values later. The backend starts successfully with empty API keys. A comparison without keys returns structured provider errors instead of fake answers.

## 10. Running the Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs at [http://localhost:5173](http://localhost:5173).

The landing screen shows **Backend Status: Connected** when `GET /health` succeeds, or **Backend Status: Disconnected** when the backend is unreachable.

Optional: copy `frontend/.env.example` to `frontend/.env` if you need a non-default API URL. The default is `http://localhost:8000`.

## 11. Environment Variables

Backend (`backend/.env.example`):

| Variable | Purpose | Required to start the backend |
| --- | --- | --- |
| `APP_NAME` | FastAPI title | No |
| `APP_VERSION` | FastAPI version | No |
| `API_PREFIX` | Future API prefix, default `/api` | No |
| `CORS_ORIGINS` | Allowed frontend origins | No (defaults to Vite localhost) |
| `LLM_TIMEOUT_SECONDS` | Provider request timeout | No |
| `LLM_MAX_OUTPUT_TOKENS` | Max generated tokens | No |
| `MAX_PROMPT_LENGTH` | Maximum compare prompt length | No |
| `OPENAI_API_KEY` | OpenAI access | No (needed only to call OpenAI) |
| `OPENAI_MODEL` | OpenAI model name | No |
| `ANTHROPIC_API_KEY` | Claude access | No (needed only to call Claude) |
| `ANTHROPIC_MODEL` | Claude model name | No |
| `GEMINI_API_KEY` | Gemini access | No (needed only to call Gemini) |
| `GEMINI_MODEL` | Gemini model name | No |

Frontend (`frontend/.env.example`):

| Variable | Purpose | Required in Phase 1 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | FastAPI base URL | No (defaults to `http://localhost:8000`) |

Never commit real `.env` files or API keys. Never place LLM keys in frontend code.

## 12. Future Phases

Later phases are expected to add:

1. Side-by-side response rendering in the React UI
2. Independent conversation history per model
3. "Continue with this model" conversation flow

The backend comparison API exists; the frontend chat experience does not yet.
