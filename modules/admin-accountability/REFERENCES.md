# REFERENCES.md — admin-accountability pointers

## Plan sections

- **Phase 5.7** — Student redressal workflow (categories, internship-stricter timeline, anonymity option).
- **Phase 5.8** — Blacklisting workflow (trigger, cooldown, lift-able, downstream consequences).
- **Phase 5.9** — API revocation (this module emits the `redressal-upheld-api-revoke` event; the key/webhook plumbing is later).
- **Phase 5.11** — Company health score mechanic (weights, bands, transparency).
- **Phase 5.15** — Payment-cell adjudication (refunds + disputes).
- **Phase 9.6** — accountability modules stay in the monolith (UI + audit), not extracted.

## Core API consumed (the only dependency)

- `@nid/core` → `computeHealthScore(events)`, `bandFromScore(score)`, `HEALTH_EVENT_WEIGHTS`, types `HealthEvent` + `HealthBand`. Defined in `packages/core/src/rules/health-score.ts`.

## Web surfaces that compose this module

- `apps/web/app/admin/health-scores/page.tsx` + `[recruiterId]/page.tsx`
- `apps/web/app/admin/redressal/page.tsx` + `[caseId]/page.tsx` (+ `actions.ts`)
- `apps/web/app/admin/blacklist/page.tsx` (+ `actions.ts`)
- `apps/web/app/admin/payment-cell/page.tsx` (+ `actions.ts`)
- `packages/ui` `AdminShell` — nav items `health-scores`, `redressal`, `blacklist`, `payment-cell`.

## Related / future

- `/recruiter/stats` (recruiter-portal) — the recruiter's transparent view of their own band; reads the same core math.
- Student-conduct (Phase 5.10) — the symmetric student-side accountability surface; same event/decision pattern.
- `@nid/db` `health_score_events` + `redressal_cases` + `blacklist` tables — replace the JSON store; the recruiter-table join replaces the self-seeded company names.
