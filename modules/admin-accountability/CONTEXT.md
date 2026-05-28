# CONTEXT.md — admin-accountability knowledge

## The baseline + band reconciliation (the one non-obvious thing)

`@nid/core`'s `computeHealthScore(events)` returns a **delta sum** (small signed
integer, e.g. +10 or −28). `bandFromScore` expects a **0–100** scale
(≥80 excellent · ≥50 good · ≥30 watch · ≥10 restricted · <10 blacklisted).

This module reconciles them: `score = clamp(0, 100, 70 + delta)`. A clean
recruiter (no events) sits at **70 = good**; positive events climb toward
excellent, negatives fall toward restricted/blacklisted. `HEALTH_BASELINE = 70`
lives in `actions.ts`. If you ever see a score that looks "too harsh", check that
you're applying the baseline, not handing the raw delta to `bandFromScore`.

## Seed spread (so the dashboard is demoable)

| Company | Recruiter id | Δ | Score | Band |
|---|---|---|---|---|
| Acme Design Studio | NID-2026-A-0001 | +10 | 80 | excellent |
| Bauhaus Interiors | NID-2026-G-0007 | 0 | 70 | good |
| Pixel Forge | NID-2026-B-0012 | −28 | 42 | watch |
| GhostCorp Studios | NID-2025-A-0003 | ≤ −60 | ~6 | blacklisted (explicit entry too) |

Acme is the same recruiter the recruiter portal acts as — its excellent band is
the "good citizen" reference. GhostCorp shows the bottom of the funnel: severe
events → blacklisted band → an explicit blacklist entry with a 12-month cooldown.

## Invariants

1. **Score is a pure function of events.** Never persist the number; recompute every read.
2. **A redressal decision emits exactly one health event**, mapped:
   dismissed→`redressal-dismissed` (0) · warning→`redressal-warning` (−3) ·
   upheld-score→`redressal-upheld-score-impact` (−8) · upheld-revoke→`redressal-upheld-api-revoke` (−15).
3. **Decisions are one-way for the demo.** An already-decided case can't be re-decided (status guard in `decideRedressal`).
4. **Blacklist is lift-able** (not permanent) — lifting logs a reason + timestamp, never deletes the entry.

## Gotchas

- **Reset all `.dev-data/` together.** This store seeds independently of the others; clearing only some `.dev-data/*.json` is fine here (no cross-store seed coupling), but the demo reads cleanest from a full reset.
- **Deciding a redressal in the demo mutates the score live** — after deciding Pixel Forge's open `red_00001` as "upheld-score", Pixel Forge drops from 42 (watch) toward restricted. That live movement is the headline of this surface; don't "fix" it.
- The student name is never shown raw in the admin list — `studentLabel` is a programme/batch descriptor (Phase 5.7 anonymity option).

## Audit-log fields (when the audit adapter lands)

`module: 'admin-accountability'`, `action: 'redressal.decided' | 'blacklist.added' | 'blacklist.lifted' | 'payment.decided'`, `actorType: 'admin'`, plus `recruiterId`, `caseId`, `decision`, and the emitted `HealthEvent`.
