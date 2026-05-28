---
name: nid-industry-interface-session-memory
project: nid-industry-interface
last_updated: 2026-05-29
status: milestone-4-student-portal-complete
current_module: (recruiter flow + student portal end-to-end on mock data)
---

# Session Memory — NID Industry Interface (project-local)

Project-local session memory. Fully isolated from any global GCC layer.

## Last session

**Date:** 2026-05-29
**Phase:** Milestone 4 — Student portal + AI JD analyzer + native harness — COMPLETE (Task 39 admin surfaces remains)
**Latest commit:** `e4a1b20 chore(harness): runnable native boundary harness + CI + lean hooks (Phase 9.5)`

## AI JD analyzer (Task 37) — the first cross-language seam

`services/ml-jd-analyzer/` is a **Python** worker (stdlib `http.server`, zero-install; FastAPI/Pydantic
is the documented production swap). It classifies JD scope creep from structured fields and returns a
**graduated** multiplier (×1.3–1.7) + flagged skills + rationale — richer than the legacy binary 1.0/1.4.

- `@nid/core` gained a types-only `JdScopeAnalyzer` port. `modules/jd-posting/src/scope-analyzer.ts`
  implements it over HTTP: `fetch` + 1.5s `AbortController` timeout + Zod-validate the response +
  **graceful fallback** to the deterministic 1.0/1.4 heuristic when the worker is down.
- **Submit gate stays deterministic** (JD posting never hard-depends on the worker). The **admin
  moderation view** (`/admin/jds/[jdId]`) runs `gateReportForAsync` → shows source (ML analyzer /
  fallback), multiplier, flagged skills, rationale.
- Seed `jd_00004` "Product Designer (frontend-heavy)" bundles 3 dev skills + delivery → ×1.6 → adjusted
  floor ₹9.6L, offered low ₹8L → **below floor**. Verified: worker-up shows ML ×1.6; worker-down falls
  back to ×1.4; both HTTP 200 (no crash).
- Run the worker: `cd services/ml-jd-analyzer && python3 app.py` (PORT 8000). `ML_WORKER_URL` overrides.

## What just landed — the student portal de-fakes the offer loop

`modules/student-portal` (7th module). The headline: the recruiter offers page used to fake
student accept/decline with demo buttons. Now the **student** accepts/declines in their own
`/student/offers` inbox, routed through `offer-cascade.recordResponse`, which drives the real
wave cascade. Verified end-to-end: outstanding 1 → filled 1/2 on the recruiter board, then
reset to the pending seed.

Module design:
- **Owns only per-cycle opt-in** (mutable JSON store). Profile + eligible-JD feed are read
  models composed from candidate-browse (`getCandidate`) + jd-posting (`listJdsByStatus`).
- **Dependency direction:** student-portal → {candidate-browse, jd-posting}. Downstream, acyclic.
- **Composition root = the page** (`/student/applications` stitches shortlist + slot + offer),
  mirroring the recruiter offers page. Keeps module deps to two.
- Routes: `/student` (dashboard), `/student/cycles` (opt-in toggle), `/student/jds` (eligible
  feed), `/student/applications` (tracker), `/student/offers` (real inbox).
- `StudentShell` atom (4th shell) + `apps/web/lib/demo-student.ts` (stu_0005, Aanya Roy) +
  `apps/web/lib/money.ts`. Landing now has a prototype-surfaces strip linking all three portals.

Seed coherence for stu_0005 across three stores: candidate-browse shortlist + offer-cascade
pending Wave-1 offer (₹12L) + student-portal opt-in. So the inbox lands populated.

## Full demo now runnable end-to-end

```
/apply → token tracker → admin issues credentials
  → recruiter posts JD (stipend gate) → admin moderates → published
  → recruiter browses (discipline-filtered, individual shortlist) → books slots → interview console
  → recruiter issues wave offer
  → STUDENT opts in → sees eligible feed → tracks application → ACCEPTS offer in /student/offers
  → recruiter offer board reflects filled 1/2  ← the loop is now real on both sides
```

## Modules built (7)

recruiter-onboarding · jd-posting · candidate-browse · slot-booking · interview-console ·
offer-cascade · student-portal. Each has a hand-written 5-markdown contract. UI atoms: Button,
StatusPill, Field, PageShell, AdminShell, RecruiterShell, StudentShell.

## Verified this session

- `pnpm -r typecheck` clean across all 12 workspace projects (strict + exactOptionalPropertyTypes + noUnusedLocals).
- All `/student/*` routes + `/recruiter/jds/jd_00001/offers` + landing return 200.
- Real accept path (`recordResponse`) drives the cascade; both student + recruiter surfaces reflect it.

## Key decisions + gotchas (carry forward)

- **`exactOptionalPropertyTypes`:** declare optional fields `field?: T | undefined`; spread optionals conditionally. Applies to every new module + page.
- **`z.coerce.boolean('false')` is truthy** — convert form strings to real booleans in the action before the schema (done in `/student/cycles/actions.ts`).
- **node-using modules extend `tsconfig.node.json`** so standalone `tsc` resolves `node:fs`.
- **Mock JSON stores live at `apps/web/.dev-data/`** (cwd-based). Clear ALL of them together to reset — clearing one desyncs the seed coherence (3 stores reference stu_0005).
- **Kill stale `next dev` (`pkill -9 -f next`) before a clean verify**; restart to register new `app/api/*` route dirs (Turbopack).
- **Relative imports omit `.js`** (Turbopack resolves TS workspace source literally).
- **Documented seam:** student-portal opt-in is NOT yet unified with recruiter-side candidate-browse opt-in (candidate-browse reads its own seed). Unify at the `@nid/db` layer. Not a bug — intentional for the slice.
- **Git convention (project-local, isolated):** `git -c commit.gpgsign=false -c user.email='build@nid-industry-interface.local' -c user.name='NID Industry Interface Build'`. Conventional Commits. No Claude co-author trailer (matches the existing history + isolation mandate).

## Native harness (Task 38) — runnable, lean

- `pnpm boundaries` = `scripts/check-boundaries.mjs` (dependency-free Node). dependency-cruiser
  can't resolve TS under pnpm's isolated layout (JS-only parser → "Unexpected token '*'"), so the
  runnable check is this script: no cross-module internal imports (public `@nid/*` only), core
  purity, no circular `@nid/*` deps. Negative-tested (planted violations → exit 1).
  `boundaries:depcruise` kept as a documented fallback for TS-resolvable CI.
- `pnpm check:contracts` = every `modules/*` has all 5 non-empty markdown contracts.
- `pnpm lint:ws` = root ESLint flat config (`no-explicit-any`, `consistent-type-imports`) over
  modules + packages; apps/web keeps `next lint`. Clean at error severity.
- `pnpm harness` = boundaries && check:contracts && typecheck (hook-facing, dependency-light).
- `.github/workflows/ci.yml` — static `run:` steps only (no `${{ }}` → shell), clears the
  command-injection scanner that blocked the earlier attempt. `lefthook.yml` is opt-in (no auto-install).

## Next step — last remaining plan option

**Remaining admin surfaces** (Task 39) — Phase 5 supporting flows: health scores, student
redressal, blacklist, payment-cell. Health-score math already exists in `@nid/core`
(`computeHealthScore` / `bandFromScore`) — these are admin UIs over it + new redressal/blacklist
stores (JSON-backed, same swap-later pattern). Likely a `modules/admin-accountability` module (gets
its own 5-markdown contract, which the harness now enforces) + `/admin/health-scores`,
`/admin/redressal`, `/admin/blacklist`, `/admin/payment-cell` routes. Mind: any new module under
`modules/` MUST ship all 5 markdowns or `pnpm check:contracts` fails.

Done this session: student portal (Task 36) + AI JD analyzer (Task 37) + native harness/CI (Task 38).

## Session-start protocol reminder

Per Phase 9.3: read this file, ask the user explicitly whether to continue (and which direction)
or start fresh; never auto-continue; honor session-bloat detection past ~50K tokens. Mind the
`apps/web/.dev-data` reset-all, stale-dev-server, exactOptionalPropertyTypes, and
z.coerce.boolean gotchas.
