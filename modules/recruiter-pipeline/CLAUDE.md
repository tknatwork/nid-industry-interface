# modules/recruiter-pipeline — Module Entry Point

> Scoped to the forward-only linear recruiter pipeline + its append-only audit log (Round 4 §B). Root context: [[../../CLAUDE.md]].

## What this module owns

```
published → shortlisting → plan-locked → interviewing → tallied → offer-sequencing → letters-out
   └─ strictly forward. rank(to) > rank(from) or it does not move. ──────────────────────┘
```

A single per-JD stage cursor that walks the 7 stages above and **never goes backward**. Once a stage is entered, the prior one is conceptually frozen (the UI enforces read-only; this module is the source of truth for "which stage are we in"). Alongside the cursor it owns an **append-only audit ledger** — every recruiter action in the journey lands here as an immutable, ordered `AuditEntry`, so the whole pipeline is one replayable trail.

**Linearity invariant (load-bearing): `advanceStage` is forward-only AND idempotent.** A backward or equal target is a silent no-op — no stage change, no audit write. A re-advance to the current stage changes nothing (timestamp preserved). This is exactly what the Wave 2 linearity verifier asserts (backward POST = no-op; can't un-advance).

## The one editability exception

The Before "Lego" plan stays structurally editable until During begins. We express this with `isPlanEditable(jdId)` (true only before `plan-locked`), **not** an extra stage. After lock, day-of reassignments are `plan-override` audit entries the UI overlays on the frozen grid — the locked plan is never mutated in place.

## What this module does NOT own

- **Round results / scores / tally** — those live in `@nid/module-interview-console`. This module only records that they happened (`round-recorded`, `tally-computed`).
- **Offer state, sequence, deadlines** — those live in `@nid/module-offer-cascade`.
- **Ownership / auth** — the calling server action enforces `requireOwnedJd`; this module takes `actor` as a plain recruiter-id string (mirrors interview-console).

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API barrel. |
| `src/types.ts` | `PipelineStage`/`PipelineState`/`AuditEntry`/`AuditAction`, `STAGE_ORDER`, `rankOf`, Zod schemas. |
| `src/store.ts` | JSON-backed pipelines store (`.dev-data/recruiter-pipeline.json`, `/tmp` on Vercel), `syncKv` mirror. |
| `src/actions.ts` | `getStage`/`getPipeline`/`canAdvanceTo`/`advanceStage`/`appendAudit`/`listAudit`/`isPlanEditable`. |
| `test/pipeline.test.ts` | Forward-only no-op, idempotent re-advance, append-only audit order. |

Read [[AGENTS.md]], [[CONTEXT.md]], [[REFERENCES.md]], [[SKILLS.md]] next.
