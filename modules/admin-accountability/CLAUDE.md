# modules/admin-accountability — Module Entry Point

> Scoped to the admin accountability surfaces (Phase 5.7–5.11): company **health scores**, student **redressal**, **blacklist**, and **payment-cell**. This is the loop that makes every upstream guardrail enforceable rather than advisory. Root context: [[../../CLAUDE.md]].

## What this module owns

```
/admin/health-scores            One row per recruiter — score + band, worst first
  └─ /admin/health-scores/<id>   Event ledger + band + blacklist status
/admin/redressal                 Student complaints against companies (queue)
  └─ /admin/redressal/<caseId>   Decide → emits a health event → score moves
/admin/blacklist                 Add (reason + cooldown) / lift (logged reason)
/admin/payment-cell              Refund / dispute adjudication queue
```

The score is **recomputed from events, never stored** — it is a pure function of
history (`@nid/core` `computeHealthScore` + `bandFromScore`). A clean recruiter
starts at a **70 baseline ("good")**; events adjust up/down. The baseline lives
here because core's `computeHealthScore` is a pure delta-sum primitive and the
band scale is 0–100 — the module reconciles them.

## The accountability loop (why this module matters)

```
student files redressal ─▶ admin decides ─▶ health EVENT appended
                                              │
                                              ▼
                         score recomputes (core) ─▶ band may drop
                                              │
                                              ▼
                         admin can blacklist (logged, cooldown) ─▶ re-apply blocked
```

## What this module does NOT own

- **The score math** — `@nid/core` (`computeHealthScore`, `bandFromScore`, `HEALTH_EVENT_WEIGHTS`). This module persists events and composes the math; it never re-implements weights.
- **The recruiter-facing view of their own score** — `/recruiter/stats` (a recruiter-portal surface) reads the same band; not built in this slice.
- **Student-side conduct** (no-show after acceptance) — symmetric Phase 5.10 surface, a documented follow-on (same event/decision pattern, student-keyed).
- **API revocation plumbing** — `redressal-upheld-api-revoke` records the *event*; the actual key revocation + webhook (Phase 5.9) is a later integration.
- **Real DB** — JSON-backed mock store; swap-later. Companies are self-seeded here (production joins the recruiter table).

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API. |
| `src/types.ts` | Health/redressal/blacklist/payment types + Zod decision schemas. |
| `src/store.ts` | JSON store; seeds 4 companies across bands + cases. |
| `src/actions.ts` | scores · redressal decide (emits event) · blacklist · payment-cell. |

Read [[AGENTS.md]], [[CONTEXT.md]], [[REFERENCES.md]], [[SKILLS.md]] next.
