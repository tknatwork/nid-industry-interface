# AGENTS.md — Module work protocol (recruiter-pipeline)

> Read before touching any file in this module. Root protocol: [[../../AGENTS.md]].

## Rules

1. **No cross-module internal imports.** Consumers use `@nid/module-recruiter-pipeline`. This module depends only on `@nid/db` (for `syncKv`) and `zod`. It must NOT import interview-console, offer-cascade, candidate-browse, etc. — that would couple the linear spine to round/offer state it deliberately does not own.
2. **`advanceStage` is forward-only and idempotent — never weaken this.** The guard is `rank(to) > rank(from)` against `STAGE_ORDER`. Equal or backward ⇒ return `{ ok: true, advanced: false }` and write nothing. There is no "force backward" escape hatch; reverting a JD is out of scope by design.
3. **The audit ledger is append-only.** Only ever push onto `audit`; never edit or remove an existing entry. Entry ids are minted from a monotonic counter so insertion order is stable and sortable.
4. **Omit `undefined` optional fields via conditional spread** (`...(v !== undefined ? { k: v } : {})`). The repo is `exactOptionalPropertyTypes: true` — writing `k: undefined` is a type error. Applies to `studentId`, `round`, `meta` on every `AuditEntry`.
5. **Zod-validate at the boundary.** `appendAudit` and `advanceStage` parse their inputs (`auditAppendSchema` / `advanceOptionsSchema`) before persisting. No raw casts of caller input.
6. **Ownership is the caller's job.** Take `actor` as a string; assume the server action already ran `requireOwnedJd`. Do not reach for session/auth here.
7. **Store mirrors the house pattern.** `loadState`/`persist(state)` + `syncKv('recruiter-pipeline', state)`, with the `/tmp`-on-`VERCEL` vs `.dev-data` path switch — identical in shape to offer-cascade/interview-console. Do not invent a new persistence scheme.

## Active-log rule (Round 4 §B)

Once `plan-locked`, the locked `InterviewPlan` (owned by interview-console) is never mutated in place. Day-of reassignments are recorded here as `plan-override` audit entries via `appendAudit`; the UI overlays them on the frozen grid. `isPlanEditable` returns false from `plan-locked` onward — gate Before-plan structural edits on it.

## Testing priority

The forward-only no-op (backward + equal targets), idempotent re-advance (no duplicate audit, timestamp preserved), and append-only audit ordering are the load-bearing invariants. Test those first — they are what the Wave 2 linearity verifier re-checks at the boundary. Clear `.dev-data/recruiter-pipeline.json` around each test so cases are independent.
