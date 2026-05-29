---
name: nid-industry-interface-session-memory
project: nid-industry-interface
last_updated: 2026-05-29
status: demo-complete — all discussed plan flows functioning on mock data
current_module: (whole 4-portal demo end-to-end on mock data)
---

# Session Memory — NID Industry Interface (project-local)

Project-local session memory. Fully isolated from any global GCC layer.

## Last session

**Date:** 2026-05-29
**Phase:** DEMO-COMPLETE + Phase-2 federation APIs + admin publishing + a11y + tests. 10 modules + Python ML worker.
**Latest commit:** `0e02624 chore: add .claude/launch.json — dev server configs`

## Latest round (federation + publishing + a11y + tests)

- **Phase-2 federation APIs** (`apps/web/app/api/**` + `apps/web/lib/federation.ts`, built by a
  background agent): public feeds (cycles.json/.ics, recruiters/past.json), institution read
  (`x-api-key` per-campus) + `POST /announcements`, recruiter **read-only** (`Bearer <keyId>`),
  `/api/v1/openapi.json`. Recruiter bearer is validated against the **live** admin-accountability
  api-keys store → revoked `key_ghost_01` returns 401 (revocable-access guardrail). No student PII /
  no write API on the recruiter side. Demo keys: institution `nid-inst-ahmedabad-demo`; recruiter
  `key_acme_01` (active), `key_ghost_01` (revoked).
- **Admin publishing**: `recruiter-engagement.publishPptWindow` + `publishMeetingSlot`;
  `/admin/engagement` opens PPT windows + meeting slots; `/admin/slots` opens interview slots.
- **A11y**: added `prefers-reduced-motion` to globals.css (skip-link/focus-visible/lang/Devanagari/
  aria/`main#main`/no-zoom-lock were already present).
- **Tests**: vitest in `@nid/core` — 16 unit tests over stipend-floor / health-score / offer-cascade;
  `pnpm -r test` wired into CI. Run with `pnpm --filter @nid/core test`.
- **`.claude/launch.json`**: dev-server configs (web :3100, ml-worker :8000, drizzle-studio :4983 —
  drizzle fails without a live DB). Start via the preview manager / `preview_start`.

GOTCHA reinforced: **Turbopack doesn't hot-register new `app/api/*` route dirs** — restart the web
server (preview_stop + preview_start, or kill+rerun) after adding API routes, else they 404.

## Demo-completeness pass (slices 40–46, after Milestone 4)

User ask: "complete all the parts discussed as per plan … showcase in the demo with all features
functioning" — mock data only, no real DB/auth.

- **Recruiter portal**: zero nav 404s now — `/recruiter/stats` (your-stats-on-return),
  `/candidates` (cross-JD browse), `/interviews` + `/offers` launchers, `/calculator` (+ public
  `/recruiters/calculator`), `/ppt` + `/meetings` (new **recruiter-engagement** module, 9th),
  `/analytics`, `/jds/[id]/close` (4.16 mandatory collective justification + 5.12 withdraw) +
  `/shortlist`.
- **Public site** (3.2): disciplines(+slug) · cycles(+slug) · campuses(+slug) · recruiters hub +
  process/guidelines/faq/past · contact(+coordinators/placement-heads) · reports · `/r/[slug]`
  microsites + `/transparency` (reads REAL anonymised redressal via `transparencyFor`). Seeds in
  `apps/web/lib/{public-content,recruiter-public}.ts`.
- **Admin**: `/admin/cycles` (+ discipline-exposure equity) · `/content` · `/offer-adjustments`
  (5.14) · `/api-keys` (5.9) · `/student-conduct` (5.10).
- **Student**: `/report-company` (files into the admin redressal queue — verified 2→3 cross-portal),
  `/conduct` (+appeal) · `/coordinator` · `/profile` · `/feedback`.

**Parallel-agent pattern (slices 44–46):** main agent built the shared foundation first (extend
admin-accountability with fileRedressal/transparencyFor/conduct/adjustments/api-keys + both shell
navs) and committed it, THEN dispatched 3 general-purpose agents on DISJOINT route trees (public /
admin / student). Agents created only new page files — no module/shell/package.json edits, no git
commits, no installs. Main verified together (typecheck/boundaries/contracts/lint + 22 routes 200 +
the cross-portal loop) and committed. Reuse this for future broad page builds; it avoided all
shared-file conflicts.

## Admin accountability (Task 39) — the loop that makes guardrails enforceable

`modules/admin-accountability` (8th module, depends on `@nid/core` only). Composes the pure
health-score math with persisted events + adjudication state.

- **Score is derived, never stored:** clean recruiter = **70 baseline** ("good"); events adjust via
  core `computeHealthScore` + `bandFromScore`. (The baseline reconciles core's delta-sum with the
  0–100 band scale — it lives in the module's `actions.ts`, not core.)
- **THE loop:** `decideRedressal` sets the case status AND appends a `HealthEvent` in the same action
  → the company's score recomputes → band can drop. Verified: upholding Pixel Forge's stipend case
  moved it **42 (watch) → 27 (restricted)** on both surfaces, then reset to seed.
- Surfaces: `/admin/health-scores` (worst-first + band distribution) + `[recruiterId]` ledger;
  `/admin/redressal` queue + `[caseId]` decide; `/admin/blacklist` add/lift (logged, cooldown, never
  deleted); `/admin/payment-cell` refund/dispute. AdminShell nav gained blacklist + payment-cell
  (the pre-existing health-scores/redressal nav links resolved to 404 before this).
- Seed spans all 5 bands: Acme excellent · Bauhaus good · Pixel Forge watch · GhostCorp blacklisted.

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

## Next step — demo + Phase-2 read APIs + publishing + a11y + tests all done; ask the user

Slices 36–50 are complete: the whole 4-portal demo, federation read APIs (+ one write endpoint),
admin publishing, a11y (reduced-motion), and a vitest unit-test pass. **Do not auto-continue**
(Phase 9.3). Ask which direction next. Candidates, none requested yet:

1. **Real infrastructure swap** — Drizzle/Postgres behind the module stores (swap-later seam ready),
   auth/SSO (replaces demo-recruiter/demo-student constants), Langfuse on the AIProvider adapter.
2. **Federation Phase-2 writes + SDKs** — institution-side write endpoints beyond /announcements,
   webhooks (HMAC), and the `@nid/industry-embed` / `@nid/industry-recruiter-sdk` packages.
3. **Deeper tests** — module integration tests (the JSON stores), a light Playwright E2E over the
   5 critical recruiter paths; raise coverage on `packages/core`.
4. **Editable cycle/content admin** — make `/admin/cycles` + `/admin/content` truly editable
   (currently display-only), and wire the lefthook hooks locally.
5. **Production ML** — replace the stdlib `services/ml-jd-analyzer` with FastAPI + Pydantic + ruff/mypy.

## How to run the full demo

- `pnpm --filter web dev` → http://localhost:3100 (landing has a "prototype surfaces" strip linking
  all three portals). Reset demo data with `rm -f apps/web/.dev-data/*.json`.
- Optional: `cd services/ml-jd-analyzer && python3 app.py` (PORT 8000) for the live ML scope analyzer
  at `/admin/jds/jd_00004`; without it, that surface falls back to the deterministic heuristic.

## Session-start protocol reminder

Per Phase 9.3: read this file, ask the user explicitly whether to continue (and which direction)
or start fresh; never auto-continue; honor session-bloat detection past ~50K tokens. Mind the
`apps/web/.dev-data` reset-all, stale-dev-server, exactOptionalPropertyTypes, and
z.coerce.boolean gotchas.
