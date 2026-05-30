# CONTEXT.md — recruiter-pipeline module knowledge

> Read after [[AGENTS.md]].

## Why this module exists

Round 3's live walkthrough surfaced an IA problem: per-JD pages lived under the "JDs" tab identity, so working an interview flipped the top tab. Round 4 reframes the portal as a **strictly linear, no-backwards GitHub-style pipeline**: setup → fill JDs → shortlist Candidates → run Interviews (Before/During/After) → float Offers. This module is the **spine** that enforces "never backwards" and records the whole journey as an append-only trail. It is intentionally small and pure: it owns the linear stage + audit, and nothing else.

## The stages (and what each gate means)

| Stage | Reached when | Freezes |
|---|---|---|
| `published` | JD is live (entry stage for any JD) | — |
| `shortlisting` | recruiter is reviewing candidates | candidate pool edits remain open |
| `plan-locked` | Before "Lego" plan is locked | the interview plan grid (now read-only; overrides only) |
| `interviewing` | During rounds begin | the plan structure; Before-edit blocked |
| `tallied` | final round scored, tally computed | round outcomes |
| `offer-sequencing` | letter sent ⇒ Offers unlocked | the selected-candidate set |
| `letters-out` | offer letters issued | the sequence |

`rank(stage)` = its index in `STAGE_ORDER`. An advance is allowed iff `rank(to) > rank(from)`.

## Entities

- `PipelineState`: `{ jdId, stage, enteredAt: Partial<Record<stage,iso>>, audit: AuditEntry[] }`. A JD with no persisted record is treated as a fresh `published` with empty audit (materialized lazily on first mutation — reads never persist).
- `AuditEntry`: `{ id, at, actorRecruiterId, action, stageAt, studentId?, round?, summary, meta? }`. `stageAt` is the stage in force when the action happened; for `stage-advanced` that is the stage just entered (`to`).
- `AuditAction` ∈ `stage-advanced | plan-locked | plan-override | round-recorded | round-advanced | tally-computed | candidates-selected | letter-sent | interviews-complete`.

## Idempotency / forward-only semantics

`advanceStage(jdId, to, actor, opts?)`:
- `rank(to) > rank(from)` → moves forward, stamps `enteredAt[to]`, appends a `stage-advanced` entry → `{ ok:true, advanced:true, stage:to }`.
- `rank(to) <= rank(from)` → **no-op**: writes nothing, appends nothing → `{ ok:true, advanced:false, stage:from }`.

This is why a stray backward POST or a double-submit re-advance is harmless: the second call simply observes it is already at/ahead of the target and returns without mutating.

## The audit ledger as a separate concern

`appendAudit(jdId, input)` records a domain event **without** moving the stage — used for `round-recorded`, `plan-override`, `letter-sent`, etc. that happen *within* a stage. Calling server actions stamp these so the recruiter journey is one ordered ledger, even though round/offer state itself lives in sibling modules. Returns `null` on invalid input (e.g. empty summary) and writes nothing.

## Demo persistence

JSON-backed at `.dev-data/recruiter-pipeline.json` (or `/tmp/nid-dev-data` on Vercel), mirrored to Postgres via `syncKv` (no-op without `DATABASE_URL`). No seed data — pipelines materialize as JDs progress.

Read [[REFERENCES.md]], [[SKILLS.md]] next.
