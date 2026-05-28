# AGENTS.md — Module work protocol (jd-posting)

## Before changing anything

1. No cross-module internal imports. Consumers import from `@nid/module-jd-posting` (our `src/index.ts`), never `src/store.ts`.
2. Reuse `@nid/core` Jd entity types. Do not redefine the JD shape — extend or narrow the core type.
3. Read [[CONTEXT.md]] for the immutability rule and the gate semantics.

## The immutability rule (load-bearing)

- A JD in `draft` status is editable.
- Once a JD moves to `in-moderation` or `published`, it is **frozen**. Editing means creating a new JD with `replacesJdId` pointing at the original.
- Do not add an "edit published JD" path. That is a deliberate non-feature (Phase 8.2 out-of-scope list).

## The pre-publish gate

- Runs on the `submitForModeration` use case, never on `createDraft`.
- Currently a single deterministic check: `@nid/core`'s `checkStipendFloor` with `scopeCreepMultiplier = 1`.
- When the Python ML analyzer lands, it supplies a real multiplier + scope-creep flags. The gate's structure does not change — only its inputs. Keep the gate a pure function so the analyzer can be slotted in without touching callers.
- For full-time: BOTH range endpoints must clear the floor. For internships: the single stipend must clear it.

## When adding skills or stipend floors

- Skills + floors are seed data in `src/skills.ts` / `src/stipend-floors.ts` for this slice. When the DB lands they move to admin-editable tables (Phase 6.10 JD schema governance). Keep them as plain data so the move is a copy, not a rewrite.

## When validating input

- All form input passes through the Zod schemas in `src/types.ts`. No raw casts.
- Compensation is stored in paise (integer) to avoid float drift, matching `@nid/core`.

## When testing

- The pre-publish gate (`checkStipendFloor` wiring) is the load-bearing logic — test it first: below-floor full-time low endpoint rejects, above-floor passes, internship single-value path works.

Read [[CONTEXT.md]] next.
