# Deploying the live demo

Goal: a public, clickable URL for the NID Industry Interface prototype, hosted on
**Vercel**, source in a **public GitHub repo**. No laptop hosting, no active CI.

## TL;DR

1. Push this repo to a **public** GitHub repo (its own repo).
2. On **vercel.com → Add New Project → Import** that repo.
3. Set **Root Directory = `apps/web`** (Framework auto-detects **Next.js**). Leave build/install at defaults.
4. **Deploy.** You get a `https://<project>.vercel.app` URL. Done — share it.

That's the whole thing. Everything below is the *why* and the caveats.

## Why this works (the one thing that matters)

The demo's data layer is **mock JSON stores** that `writeFileSync` to a `.dev-data/`
folder. Serverless platforms (Vercel) give each function a **read-only filesystem
except `/tmp`**, so the stores are wired to write to **`/tmp/nid-dev-data`** when
`process.env.VERCEL` is set (see any `modules/*/src/store.ts`). That means:

- **State is live + consistent within a warm instance** — click a full flow
  (apply → credentials → post JD → moderate → shortlist → offer → student accepts →
  recruiter board updates) and it all persists.
- **State re-seeds on a cold start / redeploy.** For a demo this is a *feature*:
  every fresh session starts from the curated seed (Acme = excellent band, the
  scope-creep JD `jd_00004`, the seeded pending offer, etc.).
- **Caveat (low-traffic demo):** under heavy concurrency Vercel may spin up
  multiple instances, each with its own `/tmp`. For a solo walkthrough you stay on
  one warm instance, so this is a non-issue. For rock-solid multi-user state, swap
  the stores to the wired Postgres or Vercel KV (the store interface is the single
  swap point — see `packages/db` + the `.gcc` notes).

Pages under `/recruiter`, `/admin`, `/student` are `force-dynamic` (segment
layouts) so every request reads live store state rather than a build-time snapshot.

## Environment variables

**None are required** for the core demo — it's all mock data. Optional:

| Var | Purpose | Default |
|---|---|---|
| `ML_WORKER_URL` | Live AI JD scope-analyzer (Python worker) | unset → graceful fallback to the deterministic heuristic (the analyzer still works, labeled "fallback") |
| `DATABASE_URL` | Only for Drizzle Studio (`pnpm --filter @nid/db studio`) — the app itself doesn't use it | unset |

## The AI analyzer on Vercel

`services/ml-jd-analyzer` is a Python worker. It is **not** deployed by the Vercel
web build. With no `ML_WORKER_URL`, the JD gate falls back to the deterministic
1.0/1.4 scope-creep heuristic — so `/admin/jds/jd_00004` still shows a flagged
JD, just via the fallback path. To make it live, deploy the worker separately
(Render/Fly/etc.) and set `ML_WORKER_URL` in Vercel.

## Showing the federation API live

The Phase-2 APIs deploy with the app (they're Next route handlers). Demo creds:

```
# public (no auth)
curl https://<url>/api/public/cycles.json
# institution (per-campus key)
curl -H 'x-api-key: nid-inst-ahmedabad-demo' https://<url>/api/v1/institution/cycles
# recruiter (read-only bearer; revoked key → 401)
curl -H 'Authorization: Bearer key_acme_01' https://<url>/api/v1/recruiter/me
# OpenAPI
curl https://<url>/api/v1/openapi.json
```

## Local run

```
pnpm install
pnpm --filter web dev          # http://localhost:3100
# optional analyzer:
cd services/ml-jd-analyzer && python3 app.py   # :8000, then set ML_WORKER_URL
```

## CI

`.github/workflows/ci.yml` documents the Phase 9.5 gates (boundaries · contracts ·
lint · typecheck · tests) but is **manual-only** (`workflow_dispatch`) — it is a
showcase artifact, not an active pipeline, so the repo stays clean (no auto-runs,
no Actions minutes). Run it on demand from the Actions tab if you want to show it.
