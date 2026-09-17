# Multi-LLM Custom ChatGPT

Academic project for the IIT Patna AI/ML program.

## 1. Project Overview

This repository is a ChatGPT-like application. A single user prompt is sent to OpenAI, Claude, and Gemini in parallel. The React UI shows the three answers side by side. The user can continue the conversation with one selected model.

## 2. Project Objective

Create a clean, professional, and extensible multi-LLM comparison chat application. The frontend and backend are separate applications that communicate over HTTP. Authentication, databases, and persistence are intentionally deferred.

## 3. Core Requirements

The application:

- Sends one user question to multiple LLMs in parallel
- Displays responses in a side-by-side panel
- Lets the user choose "Continue with this model"
- Keeps an independent conversation history for each model on the backend

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

API keys live only on the backend. The frontend never calls LLM providers directly.

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

Phase 1 through Phase 6 are complete.

Phase 5:

- Frontend comparison UI implemented
- Side-by-side model responses
- Continue-with-model UI
- Session-aware frontend integration
- Responsive design

Phase 6:

- Frontend UI polish and responsive UX

Also included:

- FastAPI application with CORS for the Vite dev server
- `GET /health` endpoint
- Backend provider abstraction for OpenAI, Anthropic Claude, and Google Gemini
- Concurrent comparison through `LLMOrchestrator`
- `POST /api/chat/compare`
- Session-based conversations (`POST /api/session`, `DELETE /api/session/{session_id}`)
- Independent OpenAI, Claude, and Gemini histories
- Continue-with-model flow (`POST /api/chat/continue`)
- Normalized results with provider failure isolation
- In-memory session storage (not persisted across restarts)
- Pytest coverage with mocked SDK clients (no paid API calls)

Not included:

- Authentication
- Database
- Redis
- Docker
- Streaming
- Persistent sessions
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

Session: `POST http://127.0.0.1:8000/api/session`

Compare: `POST http://127.0.0.1:8000/api/chat/compare`

Continue: `POST http://127.0.0.1:8000/api/chat/continue`

OpenAPI docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

Optional: copy `backend/.env.example` to `backend/.env` and fill values later. The backend starts successfully with empty API keys. A comparison without keys returns structured provider errors instead of fake answers. Sessions are stored in memory and are lost when the process restarts.

## 10. Running the Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs at [http://localhost:5173](http://localhost:5173).

The header shows **Backend Connected** when `GET /health` succeeds, or **Backend Offline** when the backend is unreachable. Ask a question to compare OpenAI, Claude, and Gemini. Then choose one model to continue.

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

| Variable | Purpose | Required |
| --- | --- | --- |
| `VITE_API_BASE_URL` | FastAPI base URL | No (defaults to `http://localhost:8000`) |

Never commit real `.env` files or API keys. Never place LLM keys in frontend code.

## 12. Later Work

Phase 6 polishes the existing comparison UI. The required demo is complete. This project does not include authentication, a database, Redis, streaming, or RAG.
