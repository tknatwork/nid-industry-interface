# REFERENCES.md — candidate-browse pointers

## Plan sections

- Phase 4.4 (candidate browse — portfolio-first, individual-only, the guardrails)
- Phase 4.5 (individual shortlist with required note)
- Phase 6.7 (portfolio.nid.edu reality — no per-student pages, ingest model)
- Phase 2 principles 4 + 5 (AI-as-translator-never-judge; merit + subjectivity respected)
- Phase 8.2 (out-of-scope: AI ranking, fit-scoring, bulk shortlist, demographic sort)

## Entities consumed from `@nid/core`

- `Student`, `StudentId`, `DisciplineId`
- `Shortlist` (entity shape reference)

## Sibling modules

- `jd-posting` — supplies the published JD with `targetDisciplineIds` (the discipline filter source)
- `recruiter-onboarding` — supplies the demo recruiter
- `slot-booking` (later) — consumes the shortlist to schedule interviews
- portfolio.nid.edu ingest (later) — replaces placeholder tiles with real thumbnails

## File map

- `src/index.ts` — public API
- `src/types.ts` — CandidateView, ShortlistEntry, CandidateSort union
- `src/students.ts` — mock student seed
- `src/store.ts` — JSON-backed shortlist store (`.dev-data/candidate-browse.json`) + student lookup
- `src/actions.ts` — use cases

Read [[SKILLS.md]] next.
