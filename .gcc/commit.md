# Build History — NID Industry Interface

Append-only narrative of phase-level build progress. Do not rewrite past entries.

---

## 2026-05-29 — Phase: Plan Approval + Milestone 1 Foundations begun

**What happened:**
- The IA + Recruiter User Flows plan was approved (`/Users/tusharkant/.claude/plans/this-is-a-demo-wiggly-parrot.md`).
- Milestone 1 — Foundations begun.

**Decisions made in this phase:**
- Project is fully isolated within this folder. No propagation to or from the user's global GCC layer.
- 5-markdown contracts are hand-written, not template-generated.
- Skills are source-referenced — each SKILLS.md entry includes the skill ID and a fetchable fallback URL.

---

## 2026-05-29 — Milestone 1 Foundations complete

**Commit:** `ce9a746 chore: milestone 1 — foundations scaffold`
**Commit:** `4120c3d chore: update GCC layer — milestone 1 complete`
**Commit:** `2ccdc31 chore: pin dev server to port 3100 + fix Langfuse port`

**What landed:**
- Project root + `.gcc/` + 5 hand-written markdown contracts.
- pnpm monorepo with Node 24, TS 5.6 strict, Python 3.13 pinned.
- `@nid/ui` 3-tier design tokens (primitives → semantics → components) + W3C tokens.json + Tailwind v4 `@theme` bridge.
- `@nid/core` pure domain layer (adapter contracts, entities, rules).
- `@nid/db` Drizzle schema + seed data (3 campuses, 20 disciplines, 12 job-title mappings, Spring 2026 cycle).
- `apps/web` Next.js 15 + Tailwind v4 + landing page stub.
- `.dependency-cruiser.cjs` boundary rules.
- Dev server pinned to port 3100 (3000 is Langfuse on the dev box).

---

## 2026-05-29 — Milestone 2 Slice 1: Recruiter Onboarding

**Commit:** `b945db2 feat(milestone-2): recruiter onboarding — /apply + token tracker`

**What landed:**
- First module under the modular monolith: `modules/recruiter-onboarding/` with its own hand-written 5-markdown contract.
- JSON-backed mock store (`.dev-data/recruiter-onboarding.json`) pre-seeded with three demo tokens spanning the state machine.
- `@nid/ui` atoms — Button, StatusPill, Field, PageShell.
- `apps/web` routes — `/apply` (Server Action + Zod), `/track`, `/track/[token]` with full state-machine timeline rendering.

**Decisions made in this phase:**
- Server Action files (`"use server"`) cannot export non-functions. Pattern adopted: types + initial-state constants live in a sibling `state.ts`; `actions.ts` exports only async functions.
- Turbopack workspace-package resolution treats `.js` extensions literally for TS source. Pattern: omit the extension in relative imports across the workspaces.
- The module's mock store is hidden behind its public API; the DB-backed implementation can replace it later without callers changing.

**Verified end-to-end:**
- `/`, `/apply`, `/track` → 200
- `/track/NID-2026-A-0001` (credentials-issued) → 200 with full timeline
- `/track/NID-2026-A-0017` (fee-due) → 200 with current-step indicator
- `/track/NID-2026-A-0042` (received) → 200 with awaiting-this-step rows
- `/track/bogus` → 404

**Next phase:**
- Thin admin queue slice at `/admin/recruiters/queue` + `/admin/recruiters/<id>/credentials` so the end-to-end demo loop can run without hand-editing JSON. Then JD posting (Phase 4.2).

---

## 2026-05-29 — Milestone 2 Slice 2: Admin Recruiter Queue

**Commit:** `1811aa9 feat(milestone-2): admin recruiter queue closes the onboarding loop`

**What landed:**
- `@nid/module-recruiter-onboarding` extended with `listAll()` + `listOutboxAll()`.
- `@nid/ui` gained `AdminShell` — visually distinct chrome for the admin portal.
- `apps/web` admin routes — `/admin` (redirect), `/admin/recruiters/queue` (filter tabs + table), `/admin/recruiters/[tokenId]` (full review + per-transition Server Action forms).
- State-machine allowlist enforced server-side; revalidatePath fires on every successful transition.

**Decisions made in this phase:**
- AdminShell is its own atom, not a variant of PageShell. Distinct chrome by portal.
- Transition allowlist currently lives in the admin Server Action; will move into the module's gated `transition()` use case when DB lands.
- No auth on `/admin/*` yet — that lands in a dedicated auth module.

**Verified end-to-end:**
- The full onboarding loop runs from `/apply` → admin queue → click-through transitions → `/track/<token>` reflects every step.

**Next phase:**
- JD posting (Phase 4.2). New module `modules/jd-posting/`, multi-step structured-schema wizard at `/recruiter/jds/new`.
