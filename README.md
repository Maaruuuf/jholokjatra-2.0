# JholokJatra (ঝলকযাত্রা)

> **Find the best day to visit Bangladesh's beaches, hills, forests and heritage sites, using live public data, with every claim traceable to its source.**

---

## 1. What is this project?

JholokJatra is a Bangladesh travel companion with two parts:

- **Backend (FastAPI + AI agents):** you choose a place and a date range (up to 16 days ahead). A small team of agents pulls live data from free public APIs (weather, sea waves, river levels, cyclone alerts, earthquakes, hospitals) and returns a **go / caution / avoid** verdict for every day.
- **Frontend (Next.js):** a neumorphism-styled web app with an interactive map of 34 curated places. You can mark places as **visited** or **wishlist**, rate them, track your progress across the 8 divisions, compare destinations, and open any place to see its day-by-day forecast verdict.

It uses only free services, and it works even with **no API keys at all**.

---

## 2. What makes it exceptional

| | |
|---|---|
| **Evidence-cited verdicts** | Every reason ("rainfall 80 mm is above the avoid threshold") links to the stored raw API response via `GET /evidence/{ref}`. Nothing is made up. |
| **Deterministic core, LLM only narrates** | Verdicts come from transparent rules in `scoring.py`, not from an LLM. The LLM (Groq) only writes the short summary. |
| **Hallucination check** | Every number the LLM writes is verified against the evidence. If one doesn't match, the app retries once, then falls back to a template. |
| **Safety veto between agents** | If the weather agent says "go" but the safety agent sees a cyclone alert, the final verdict is **avoid** and the conflict is shown. |
| **Human approval gate** | If no day is a clear "go", the plan pauses and asks you before recommending a risky day. Every decision is logged in an audit trail. |
| **Works offline from LLMs** | No key, rate-limited, or out of token budget? You get a deterministic template summary instead of an error. |
| **Prompt-injection defence** | Scraped text (Wikivoyage etc.) is sanitised and never enters the planning prompt. |
| **Token economics** | Free-text requests are parsed by rules first (zero tokens); a small model is only used when needed; a per-plan token cap is enforced. |
| **Personalised thresholds** | Motion sickness, kids and elderly travellers make the rules stricter. |
| **Bangla + English** | Input like "কক্সবাজার next 5 days" works; the UI and narrative support বাংলা. |
| **Resilient data layer** | Parallel fetches, retries with backoff, SQLite cache, and stale-if-error (an old answer, clearly marked, beats none). |

---

## 3. Features

### Frontend pages

| Route | What it does |
|---|---|
| `/` | Map of Bangladesh with 34 curated places. Filter by category/status, search, click a pin to open the place card and mark it **visited** (date, 1-5 rating, note) or **wishlist**. Visited pins turn green with a check. |
| `/place/[id]` | Pick dates and get the agent verdict per day with evidence links, the approval prompt, nearby hospitals, travel tips, and nearby places you haven't visited. |
| `/visits` | Progress ring, division and category progress, 7 badges, visited and wishlist lists. |
| `/compare` | Pick 2-6 places and rank them for the same dates. |
| `/settings` | Risk tolerance, motion sickness, kids, elderly, language (English/বাংলা), light/dark theme, backend status. |

### Backend capabilities

| Area | Endpoints |
|---|---|
| Planning | `POST /plan`, `GET /plan/stream` (live progress via SSE), `GET /plans/{id}`, `POST /plans/{id}/decision`, `GET /plans/{id}/audit` |
| Evidence | `GET /evidence/{ref}` returns the raw API response behind any reason |
| Places and visits | `GET /places`, `GET /places/{id}`, `GET /places/{id}/nearby`, `PUT /users/{id}/places/{place}`, `GET /users/{id}/stats` |
| Compare | `POST /compare` ranks 2-6 places for the same dates (no LLM, fast) |
| Agent and tools | `POST /ask` (ReAct agent), `GET /tools`, `POST /tools/{name}` |
| Preferences | `GET/PUT /preferences/{user_id}` |
| Ops | `GET /health`, `GET /metrics` (latency, tokens, errors) |

Interactive API docs: `http://localhost:8010/docs`.

### Agents

`Weather` (rain, gusts, heat, thunderstorms), `Safety` (waves, floods, cyclone alerts, earthquakes), `Logistics` (nearby hospitals) and `Guide` (travel tips) run in parallel (LangGraph). A `Supervisor` merges them with a safety veto, then a `Narrator` writes the summary.

### Public data sources (all free, no key)

Open-Meteo (forecast, marine, GloFAS flood, archive), GDACS (cyclone/flood alerts), USGS (earthquakes), OpenStreetMap Overpass (hospitals etc.), Wikivoyage (tips, CC BY-SA), OpenStreetMap tiles (map).

---

## 4. Setup after `git pull`

**Prerequisites:** Git, Python 3.11+, Node.js 20+ (check with `python --version` and `node --version`).

The project has **two separate apps with two separate env files**:

| App | Folder | Env file (you create it) | 
|---|---|---|
| Backend (Python) | project root | `.env` | 
| Frontend (Next.js) | `frontend/` | `frontend/.env.local` | 

Both env files are git-ignored, so **a fresh clone has neither**. You must create them.

### Step 1: Backend setup (Windows PowerShell)

```powershell
cd jholokjatra
python -m venv .venv
.\.venv\Scripts\Activate.ps1          
python -m pip install --upgrade pip
pip install -r requirements-dev.txt

```

<details><summary>macOS / Linux / WSL</summary>

```bash
cd jholokjatra
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements-dev.txt
cp .env.example .env
```
</details>

### Step 2: Configure the backend `.env`

Open `.env`. The app runs with **no keys**, but a Groq key gives you the AI-written summaries.

| Variable | Meaning | Recommended |
|---|---|---|
| `GROQ_API_KEY` | Free key from https://console.groq.com/keys (Create API Key) | `gsk_...` (no quotes or spaces) |
| `LLM_PROVIDER_ORDER` | Providers tried in order | `groq` |
| `GROQ_MODEL_SMALL` / `GROQ_MODEL_LARGE` | Small and large model tiers | `openai/gpt-oss-20b` / `openai/gpt-oss-120b` |
| `GROQ_REASONING_EFFORT` | Thinking effort for gpt-oss models | `low` |
| `LLM_MAX_TOKENS_PER_PLAN` | Token cap per plan | `12000` |
| `GEMINI_API_KEY` | Optional second provider (https://aistudio.google.com/apikey) | empty |
| `OLLAMA_ENABLED` | Use a local Ollama model | `false` |
| `USE_CHROMA` | Semantic tips search (downloads an ~80 MB model on first use) | `false` |
| `CORS_ORIGINS` | Browser origins allowed to call the API | `http://localhost:3000,http://127.0.0.1:3000` |
| `HTTP_USER_AGENT` | Identify yourself to OSM/Wikivoyage | put your email in it |
| `DATA_DIR` | Where the SQLite database lives | `data` |

### Step 3: Verify the backend

```powershell
python -m scripts.check_keys          # confirms your Groq/Gemini key works
python -m scripts.smoke_test_apis     # confirms the free public APIs are reachable from your network
pytest -q                             # 40 offline tests, no keys or internet needed
```

### Step 4: Run the backend

```powershell
uvicorn app.main:app --reload --port 8010
```

Open `http://localhost:8010/docs` to confirm it works.

> **Why 8010?** On some Windows machines port 8000 is reserved by Hyper-V/WSL/Docker and fails with `WinError 10013`. Any free port works, but the frontend must point at the same one.

### Step 5: Frontend setup (second terminal)

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

`frontend/.env.local` contains one variable:

```
NEXT_PUBLIC_API_URL=http://localhost:8010
```

- It **must match the backend port** from Step 4.
- Variables starting with `NEXT_PUBLIC_` are baked into the browser bundle, so **never put secrets there**. API keys belong only in the backend `.env`.
- After editing `.env.local`, **restart** `npm run dev`.

### Quick API test (optional)

```powershell
Invoke-RestMethod -Method Post http://localhost:8010/plan -ContentType "application/json" -Body '{"destination":"saint_martin"}'
```

(In PowerShell plain `curl` is an alias, so use `Invoke-RestMethod` or `curl.exe`.)

### Optional: other ways to run

| Option | Command |
|---|---|
| Streamlit UI | `pip install -r requirements-ui.txt` then `$env:API_URL="http://localhost:8010"; streamlit run ui/app.py` |
| Docker (API + Streamlit) | `docker compose up --build` (reads `.env`) |
| Local Kubernetes (kind) | see the header of `deploy/k8s/jholokjatra.yaml` |
| Frontend production build | `cd frontend && npm run typecheck && npm run build && npm start` |
| Past-event backtest | `python -m evals.backtest` (needs internet; writes `evals/reports/backtest.md`) |

### Troubleshooting

| Problem | Fix |
|---|---|
| `WinError 10013` on startup | Port is reserved or busy. Use `--port 8010` (or another) and update `NEXT_PUBLIC_API_URL`. |
| Frontend says "Cannot reach the API" | Backend not running, wrong port in `frontend/.env.local`, or you didn't restart `npm run dev` after editing it. |
| Browser console shows a CORS error | Add your frontend origin to `CORS_ORIGINS` in the backend `.env` and restart uvicorn. |
| Summary says `template (...)` | No working LLM key or budget exhausted. Run `python -m scripts.check_keys`. The app still works. |
| Groq returns 404/400 | Model names change. Update `GROQ_MODEL_*` from Groq's model list. If it rejects `reasoning_effort`, remove that line in `GroqProvider` (`app/llm/providers.py`). |
| Tests are very slow or time out on tips | Make sure `USE_CHROMA=false`. Chroma downloads a model on first use. |
| PowerShell blocks venv activation | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Map is blank | OpenStreetMap tiles need internet access. |
| Visits disappeared | Visits are stored under a random per-browser ID. Clearing site data creates a new profile. |


---

## 5. Tech stack and what's implemented

### Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, asyncio, httpx, Pydantic v2, pydantic-settings, SQLite (WAL) |
| Agents | LangGraph (parallel agents + supervisor), a custom ReAct loop, Pydantic-validated tool registry |
| LLM | Groq `openai/gpt-oss-20b` and `openai/gpt-oss-120b` (Gemini and Ollama also supported) via a custom router |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, Leaflet |
| Design | Neumorphism with CSS-variable light/dark themes, accessible focus and reduced-motion handling |
| Optional | Streamlit UI, ChromaDB (semantic tips), Docker, docker-compose, Kubernetes (kind) manifests |
| Quality | pytest + pytest-asyncio (40 tests on a mocked internet), ruff, TypeScript strict mode, GitHub Actions CI, backtest on past events |

### Roadmap stage to code

| Stage | Where |
|---|---|
| 1. Async + FastAPI | `app/http.py` (retries, backoff, cache, stale-if-error), `app/data.py` (parallel fetch), `/plan/stream` (SSE) |
| 2. LLM fundamentals | `app/llm/router.py` (small/large tiers, provider fallback), `llm/budget.py` (token cap), rules-first `parser.py` |
| 3. Tool calling | `app/tools/registry.py` (Pydantic args, JSON schemas, recoverable errors), `llm/structured.py` (validate and retry) |
| 4. Memory | `memory/prefs.py` (cross-session preferences), `memory/tips.py` (Wikivoyage, optional Chroma), `visits.py` (visited/wishlist) |
| 5. Single agent | `agents/react.py` (ReAct, iteration cap, graceful degradation) |
| 6. Multi-agent | `agents/graph.py`, `agents/nodes.py` (weather, safety, logistics, guide, supervisor with veto, narrator) |
| 7. Human-in-the-loop | `pipeline.py` approval gate, `/plans/{id}/decision`, `/plans/{id}/audit` |
| 8. Evaluation | `tests/`, `evals/backtest.py` (Cyclone Remal, Sylhet floods, control), `verify.py` (number check) |
| 9. Observability | `tracing.py` spans, `GET /metrics` (latency, tokens, errors) |
| 10. Security | `security/sanitize.py` (injection and PII), untrusted text never reaches the planning prompt |
| 11. Deployment | `Dockerfile`, `docker-compose.yml`, `deploy/k8s/`, `.github/workflows/` |
| 12. Portfolio | `frontend/` (Next.js), `ui/app.py` (Streamlit), this README, backtest report |

### Project structure

```
jholokjatra/
├─ app/                 FastAPI backend
│  ├─ api/              routes (plans, places, tools, metrics)
│  ├─ agents/           LangGraph graph, agent nodes, ReAct loop
│  ├─ clients/          Open-Meteo, GDACS, USGS, Overpass, Wikivoyage
│  ├─ llm/              router, providers, budget, structured output
│  ├─ memory/           preferences, tips
│  ├─ security/         sanitising, PII redaction
│  ├─ tools/            validated tool registry
│  └─ places.py         34 curated places (edit to add more)
├─ frontend/            Next.js app (own package.json and .env.local)
├─ tests/  evals/  scripts/  ui/  deploy/  .github/
├─ .env.example         backend env template
└─ requirements*.txt
```

---

## Design rules

- **Evidence-cited:** each reason carries a `ref`; `GET /evidence/{ref}` returns the stored raw response.
- **Deterministic core:** verdicts come from `scoring.py`, not an LLM. The LLM only writes the summary, and its numbers are verified.
- **Safety veto:** safety "avoid" overrides weather "go", and the conflict is reported.
- **Never silently risky:** if no day is a clear "go", the plan pauses for your approval.

## Honest limitations

- Thresholds in `scoring.py` are heuristic comfort/safety rules, **not official warnings**. Follow BMD and local authorities for storm signals.
- The flood score is a heuristic on GloFAS discharge, not a calibrated flood forecast.
- The marine forecast covers about 7 days; sea trips beyond that are capped at "caution".
- Place coordinates are approximate pins and descriptions are short summaries; spot-check them before publishing.
- "Best rated" has no free API. The map uses curator picks, UNESCO flags and **your own star ratings**.
- Backtest expectations in `evals/fixtures/events.json` come from recollection of real events; verify and edit them. The backtest scores observed conditions, not forecast skill.
- No login: visits are tied to a per-browser ID. The single-process SQLite cache is fine for a demo; use Postgres/Redis before running multiple replicas.

## Data attribution

Weather and marine data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0), map data and tiles (c) [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, travel tips from [Wikivoyage](https://en.wikivoyage.org/) (CC BY-SA), alerts from [GDACS](https://www.gdacs.org/), earthquakes from [USGS](https://earthquake.usgs.gov/).
