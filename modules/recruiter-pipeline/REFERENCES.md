# REFERENCES.md — recruiter-pipeline pointers

> Where to look. Read after [[CONTEXT.md]].

## Plan sections

- Round 4 §B — Stage-gate state machine (this module: forward-only stage + append-only audit + active-log rule).
- Round 4 §A — Hybrid IA + linearity (the workspaces this spine drives; `resolveOwnedJd` vs `requireOwnedJd`).
- Round 4 §C — Interview flow (Before/During/After) — the caller that appends `plan-locked`/`round-recorded`/`tally-computed`/`letter-sent` and advances stages.
- Round 4 §E — Dashboard aggregation reads `getStage` (+ a label helper) per published JD, with a graceful fallback to `getInterviewsComplete`/`listSelected` if the getter is absent.
- Plan file: `/Users/tusharkant/.claude/plans/this-is-a-demo-wiggly-parrot.md` (heading "# Round 4 — Linear recruiter workflow").

## @nid/db (the only runtime dependency)

- `syncKv(key, value)` — durable write-through mirror to Postgres (no-op without `DATABASE_URL`). Imported by `src/store.ts`.

## Sibling modules (consumers / collaborators — NOT imported here)

- `@nid/module-interview-console` — owns plans, round results, tally, letters; calls `advanceStage`/`appendAudit` from its server actions. The `actor`-as-string convention mirrors it.
- `@nid/module-offer-cascade` — owns offer state, sequence, deadlines; the `offer-sequencing`/`letters-out` stages gate its UI.
- `@nid/module-candidate-browse` — supplies the shortlist worked during `shortlisting`.

## File map

- `src/index.ts` — public API barrel.
- `src/types.ts` — stage/audit types, `STAGE_ORDER`, `rankOf`, `planEditableAt`, Zod schemas.
- `src/store.ts` — `.dev-data/recruiter-pipeline.json` (or `/tmp/nid-dev-data` on Vercel), `syncKv('recruiter-pipeline', state)`.
- `src/actions.ts` — the 7 exported functions.
- `test/pipeline.test.ts` — vitest (`vitest run`); store cleared around each test.

## Mirrored module (structure reference)

- `modules/offer-cascade/{package.json,tsconfig.json,src/store.ts,src/index.ts}` — this module copies its store pattern, tsconfig, and barrel style verbatim.

NOTE: mock data lands at `apps/web/.dev-data/` under `pnpm --filter web dev`.
