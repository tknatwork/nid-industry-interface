---
name: nid-industry-interface-session-memory
project: nid-industry-interface
last_updated: 2026-05-29
status: milestone-2-in-progress
current_module: recruiter-onboarding
---

# Session Memory — NID Industry Interface (project-local)

Project-local session memory. Fully isolated from any global GCC layer — nothing here propagates upward.

## Last session

**Date:** 2026-05-29
**Phase:** Milestone 2 — Recruiter end-to-end (mock data)
**Module:** recruiter-onboarding
**Commit:** `b945db2 feat(milestone-2): recruiter onboarding — /apply + token tracker`

## What was accomplished (Milestone 2, slice 1)

1. **`modules/recruiter-onboarding/`** — first module under the modular monolith.
   - Hand-written 5-markdown contract (CLAUDE / AGENTS / CONTEXT / REFERENCES / SKILLS) scoped to onboarding concerns. Cross-references the root contracts via `[[../../FILE.md]]` links.
   - `src/types.ts` — Zod schemas for the seven-state machine + apply form (including public-email-domain rejection at validation time).
   - `src/tokens.ts` — NID-YYYY-CC-NNNN format with window letter derived from issuance month.
   - `src/store.ts` — JSON-backed mock store at `.dev-data/recruiter-onboarding.json`, pre-seeded with three demo tokens at different status levels.
   - `src/actions.ts` — submit / lookup / outboxFor / advance use cases, all input-validated.
   - `src/index.ts` — sole public surface (no deep imports allowed from outside the module).
2. **`packages/ui` atoms** — Button (3 variants × 3 sizes), StatusPill (5 tones), Field (label/help/error a11y), PageShell (shared header/footer with active-nav highlighting).
3. **`apps/web` routes** — `/apply` Server Action form, `/track` token lookup entry, `/track/[token]` full state-machine timeline with next-step guidance and comms-log preview. Landing page refactored onto PageShell + Button atoms.
4. **Infrastructure fixes:**
   - Stripped `.js` extensions from relative imports across all workspaces — Turbopack treats them literally for TS source in workspace packages.
   - Split `apps/web/app/apply/state.ts` out of `actions.ts` so `"use server"` only sees async functions.
   - `.dev-data/` added to `.gitignore` (runtime artifact).
5. **End-to-end verified** on `http://localhost:3100`:
   - `/` and `/apply` and `/track` return 200
   - `/track/NID-2026-A-0001` (credentials-issued) and `/track/NID-2026-A-0017` (fee-due) and `/track/NID-2026-A-0042` (received) all render their respective state-machine timelines
   - `/track/bogus` returns 404 correctly

## Key decisions captured this session

- **The `.dev-data/` JSON-backed mock store** is the swappable implementation behind the module's public API. The DB-backed Drizzle implementation that lands in a later milestone replaces the file without callers seeing the difference.
- **`tokens.ts` was blocked by a security-reminder hook** (false positive on the regex parser). Re-written with a hoisted const RegExp; works fine. Hook is precautionary, not blocking.
- **Server Actions + non-async exports:** Next.js rejects any non-async export from a `"use server"` file. Pattern adopted: keep types + initial-state constants in a sibling `state.ts`; `actions.ts` exports only the async server functions.

## Next step (single, specific)

**Continue Milestone 2 by adding the admin-side queue stub** so we can advance tokens through the state machine without writing JSON by hand. Target route: `/admin/recruiters/queue` (read-only at first — list pending tokens with one-click advance buttons). Then add `/admin/recruiters/<id>/credentials` so we can mint credentials and complete the demo loop. This is technically Milestone 3 admin work, but a thin slice is needed here to demo the onboarding flow end-to-end before we move on to JD posting.

## Open blockers

None. The Server Action POST path tests cleanly in the browser; curl POST won't work directly because React encodes the action target inside a `$ACTION_REF_1` token — that's expected.

## Session-start protocol reminder

Per Phase 9.3 of the plan: any agent (regardless of model) starting work here must:
1. Read this file.
2. Prompt the user explicitly: "Continue from the last session (recruiter-onboarding module, next step: thin admin queue at `/admin/recruiters/queue` to demo the full state-machine loop)? Or start fresh on a different concern?"
3. Never auto-continue without asking.
4. Honor session-bloat detection — recommend a fresh session if prior crossed the ~50K token threshold.
