# Azure Bay Guest Assistant

An AI-powered guest assistant for a hotel website. Guests chat to ask about the property (check-in, pool, breakfast, cancellation, rooms) and check room availability through a simple form. The backend grounds every answer in a hotel knowledge base and keeps availability and pricing logic outside the LLM.

- **Frontend:** React + Vite + TypeScript + Tailwind + Framer Motion
- **Backend:** Python, FastAPI, Pydantic
- **LLM:** Google Gemini (with function/tool calling)
- **Tests:** pytest (backend), Vitest + Testing Library (frontend), Playwright (end-to-end)

**Live demo:** https://<project>.vercel.app  ·  **API:** https://<your-service>.onrender.com/docs

> The demo runs on free tiers. The first request after idle time can take 30-60 seconds (backend cold start), and the Gemini free tier allows about 20 model requests per day, so chat may show a temporary-unavailable message once that is used up. The availability form does not use the model and keeps working.

Docs: [Architecture](docs/ARCHITECTURE.md) · [Product, UX, engineering and AI decisions](docs/DECISIONS.md) · [Evaluation scenarios and results](docs/EVALUATION.md)

## Project structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # routes, CORS, error handlers, request logging
│   │   ├── schemas.py           # request/response models and validation
│   │   ├── prompts.py           # system prompt and tool definitions
│   │   ├── data/hotel.json      # knowledge base
│   │   └── services/            # chat_service, llm_client, availability, knowledge, session_store
│   └── tests/                   # 50 backend tests
├── frontend/
│   ├── src/                     # components, hooks, api client, unit tests
│   └── e2e/                     # Playwright tests
└── docs/
```

## Prerequisites

- Python 3.10+
- Node.js 20+
- A free Gemini API key from https://aistudio.google.com/apikey

## Setup and run

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate      # Git Bash on Windows
# .venv\Scripts\activate           # Windows PowerShell / cmd
# source .venv/bin/activate        # macOS / Linux
pip install -r requirements.txt
cp .env.example .env               # then edit .env and set GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

API docs (Swagger): http://localhost:8000/docs

### 2. Frontend (second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend, so the browser never sees a backend URL or any API key.

### Configuration (`backend/.env`)

| Variable | Purpose | Default |
|---|---|---|
| `GEMINI_API_KEY` | Gemini key (server side only) | none |
| `LLM_MODEL` | Model name | `gemini-3.6-flash` |
| `LLM_TIMEOUT_SECONDS` | Model call timeout | `20` |
| `ALLOWED_ORIGINS` | CORS origins, comma separated | `http://localhost:5173` |
| `LOG_LEVEL` | Logging level | `INFO` |

Without a key the app still starts. Chat requests return a friendly error, and the availability form keeps working because it does not use the LLM.

For a deployed frontend on a different domain, set `VITE_API_BASE_URL` (see `frontend/.env.example`) and add the frontend URL to `ALLOWED_ORIGINS`.

## Running the tests

```bash
# backend (from backend/, venv active): 50 tests, no API key needed (uses a fake LLM)
python -m pytest -v

# frontend unit/component tests (from frontend/): 16 tests
npm test

# end-to-end (from frontend/, with backend and frontend both running)
npm run e2e                 # deterministic flows
E2E_LLM=1 npm run e2e       # also runs tests that call the live model (Git Bash syntax)
```

## API

### `POST /api/chat`

Request:

```json
{
  "session_id": "optional, returned by the first call",
  "message": "What time is check-in?",
  "availability": { "check_in": "2026-11-10", "check_out": "2026-11-12", "adults": 2 }
}
```

`availability` is optional. The frontend form sends it, which skips the LLM and runs the deterministic availability logic directly.

Response:

```json
{
  "request_id": "a1b2c3d4e5f6",
  "session_id": "…",
  "type": "answer | availability | needs_input | fallback | error",
  "message": "Check-in is from 3:00 PM.",
  "availability": null,
  "missing_fields": []
}
```

| `type` | Meaning | Frontend behaviour |
|---|---|---|
| `answer` | Grounded answer from the knowledge base | Normal bubble |
| `availability` | Result of the availability tool | Room cards |
| `needs_input` | Dates or guest count missing | Opens the form, highlights missing fields |
| `fallback` | Not answerable from the data | Highlighted bubble that points to the front desk |
| `error` | Model unavailable or timed out | Error card with **Try again** |
| `RATE_LIMIT_PER_MINUTE` | Per-IP limit on `POST /api/chat` (`0` disables it) | `0` |

Other endpoints: `POST /api/availability`, `GET /api/hotel`, `GET /api/health`. Validation errors return HTTP 422 with `{request_id, error, detail}`, and unexpected errors return HTTP 500 in the same shape.

### curl examples (Git Bash)

```bash
# health
curl http://localhost:8000/api/health

# grounded answer
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Does the hotel have a swimming pool?"}'

# availability via natural language (model calls the tool)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Any rooms for 2 guests from 10 Nov 2026 to 12 Nov 2026?"}'

# missing information -> type "needs_input"
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Do you have rooms next weekend?"}'

# structured availability (no LLM involved)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Check availability","availability":{"check_in":"2026-11-10","check_out":"2026-11-12","adults":2}}'

# validation error -> 422
curl -X POST http://localhost:8000/api/availability \
  -H "Content-Type: application/json" \
  -d '{"check_in":"2026-11-12","check_out":"2026-11-10","adults":2}'
```

Use future dates. Past dates are rejected.

## AI tools used

- **Claude (Anthropic):** pair-programming assistant for planning the architecture, generating and iterating on code, tests and documentation. I reviewed, ran and debugged everything, and adapted it (for example, switching the LLM provider from Claude to Gemini, and the currency to INR).
- **Google Gemini:** the runtime model inside the product, used through the Gemini API.

## Deployment

- **Backend:** Render web service, root directory `backend`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Environment: `GEMINI_API_KEY`, `LLM_MODEL`, `PYTHON_VERSION=3.12.3`, `RATE_LIMIT_PER_MINUTE=10`, `ALLOWED_ORIGINS=<frontend URL>`.
- **Frontend:** Vercel, root directory `frontend`, environment `VITE_API_BASE_URL=<backend URL>`. Redeploy after changing it.
- The API key exists only on the backend.

## Known limitations

- Availability is mocked (deterministic fake bookings), not connected to a booking system.
- Conversation memory is in-process, so it is lost on restart and is not shared across instances.
- No authentication or rate limiting. See [DECISIONS.md](docs/DECISIONS.md) for the production plan.
- Free-tier hosting and the free Gemini quota limit demo traffic. Free-tier services sleep when idle.
- The rate limiter is per-process and in memory.