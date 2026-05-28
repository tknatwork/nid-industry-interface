# services/ml-jd-analyzer — Module Entry Point

> The Python ML worker behind the `@nid/core` `JdScopeAnalyzer` port (Phase 6.11a / 6.13.1). It classifies JD scope creep from structured fields and returns a graduated stipend-floor multiplier. Root context: [[../../CLAUDE.md]]. This is a Python service, NOT a pnpm workspace member — it lives outside `apps/`/`packages/`/`modules/`.

## What this module owns

```
POST /ml/jd/scope-classify
  in : { roleType, skills:[{slug,group,required}], responsibilityCategories:[…] }
  out: { scopeMultiplier, scopeCreepDetected, flaggedSkillSlugs, detectedGroups, rationale }

GET  /health  →  { status:"ok" }
```

The classifier is **rule-based and deterministic** (Phase 6.11a: default to ML where the task is structured; no LLM, no model download). Scope creep = engineering skills bundled into a design role; the multiplier scales with how many dev skills + whether delivery/ops responsibilities indicate real build ownership.

## What this module does NOT own

- **The stipend-floor math** — that's `@nid/core` (`checkStipendFloor`). The worker only returns the multiplier; the TS gate applies it.
- **The submission gate** — JD submit stays on the TS deterministic heuristic so posting never hard-depends on this worker. The worker informs the **admin moderation view** (read-only transparency), which falls back to the heuristic if the worker is down.
- **LLM / natural-language tasks** — those are a separate self-hosted LLM service (Phase 6.11a). This worker is ML-only.
- **Discipline mapping, JD extraction** — later endpoints on this worker (`/ml/jd/extract`, `/ml/discipline-classify`); not in this slice.

## Run it

```
cd services/ml-jd-analyzer
python3 app.py            # stdlib http.server, no install, PORT=8000 default
# TS side finds it at ML_WORKER_URL (default http://127.0.0.1:8000)
```

## Where things live

| File | Purpose |
|---|---|
| `app.py` | `classify()` (framework-free) + stdlib HTTP handler. |
| `pyproject.toml` | ruff + mypy-strict config; production deps noted (FastAPI/uvicorn/pydantic). |

Read [[CONTEXT.md]] and [[SKILLS.md]] next.
