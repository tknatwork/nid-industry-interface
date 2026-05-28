---
name: nid-industry-interface-session-memory
project: nid-industry-interface
last_updated: 2026-05-29
status: milestone-2-jd-posting-slice-complete
current_module: jd-posting
---

# Session Memory — NID Industry Interface (project-local)

Project-local session memory. Fully isolated from any global GCC layer.

## Last session

**Date:** 2026-05-29
**Phase:** Milestone 2 — Recruiter end-to-end (mock data)
**Module:** jd-posting
**Latest commit:** `87ac884 feat(milestone-2): JD posting wizard with structured schema + stipend gate`

## Milestone 2 progress so far

1. **Slice 1** — recruiter onboarding: `/apply` + `/track/<token>` (commit b945db2).
2. **Slice 2** — admin recruiter queue closes the onboarding loop (commit 1811aa9).
3. **Slice 3 (this step)** — JD posting wizard + stipend-floor gate (commit 87ac884).

## What was accomplished this step

1. **`modules/jd-posting/`** — second module, hand-written 5-markdown contract.
   - Zod draft (permissive) + moderation (strict) schemas built on `@nid/core` `Jd`.
   - JSON-backed mock store (`.dev-data/jd-posting.json`).
   - Canonical skill taxonomy (25 skills / 6 groups; engineering group flagged for scope review) + stipend-floor matrix (programme × role-type).
   - `submitForModeration` runs the pre-publish gate: strict schema → `checkStipendFloor` (`@nid/core`) with a **1.4× multiplier when an engineering skill is bundled** into a design role (the deterministic slice of scope-creep detection until the ML analyzer lands).
2. **`RecruiterShell`** atom — authenticated-portal chrome with "acting as <company>" demo banner.
3. **`apps/web/lib/demo-recruiter.ts`** — fixed demo recruiter (Acme Design Studio / NID-2026-A-0001) standing in for a session until auth lands.
4. **Recruiter routes:** `/recruiter` → dashboard (stat cards), `/recruiter/jds` (list with status pills + comp summary), `/recruiter/jds/new` (full structured wizard — role basics, conditional compensation, target programmes, grouped skills with off/preferred/required toggles, categorized responsibilities, deliverables, prose, dynamic interview rounds). Save-draft + submit-for-moderation via `startTransition` server actions; gate failures render inline.

## Verified

- All recruiter routes render 200; wizard shows every section.
- `checkStipendFloor` confirmed across 4 cases via direct `@nid/core` tsx test:
  - below-floor full-time low endpoint → BLOCKED (endpoint=low)
  - above-floor → PASS
  - 1.4× engineering multiplier (₹6.5L vs ₹8.4L adjusted) → BLOCKED, adjusted=84000000
  - internship single-value below floor → BLOCKED (endpoint=single)
- `tsx` added at root for one-off verification scripts.

## Key decisions captured this step

- **The gate wraps a pure function.** `submitForModeration` → `@nid/core` `checkStipendFloor`. When the Python ML analyzer lands it supplies the real `scopeCreepMultiplier`; the gate structure doesn't change. The deterministic 1.4× on bundled engineering skills is the interim signal.
- **Wizard uses client state + server actions called via `startTransition`** (not a form-action POST) so we don't fight FormData array-encoding for skills / responsibilities / rounds. The action receives a plain typed payload; on success the client `router.push`es to `/recruiter/jds`.
- **Skills + stipend floors are seed data inside the module.** They move to per-cycle admin-editable tables when the DB lands (Phase 6.10).
- **Verifying React Server Actions headlessly is impractical** (the action target is encoded in a `$ACTION_REF` token). We verify the load-bearing pure logic directly + smoke-test the routes; the wizard's full path works in a browser.

## Next step (single, specific)

**Admin JD moderation (Phase 5.1):** build `/admin/jds` — a queue of `in-moderation` JDs (the recruiter-onboarding queue pattern, reused) where the placement admin reviews the structured JD, sees the gate report, can edit the discipline mapping, and publishes (moving the JD to `published`) or holds for clarification. The module's `listJdsByStatus('in-moderation')` is already exported for this. After that, candidate browse (Phase 4.4) is the next recruiter-facing surface.

## Open blockers

None.

## Session-start protocol reminder

Per Phase 9.3: any agent starting work here must read this file, then ask the user explicitly whether to continue (next: `/admin/jds` moderation queue) or start fresh. Never auto-continue. Honor session-bloat detection (recommend fresh session past ~50K tokens).
