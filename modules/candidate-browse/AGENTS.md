# AGENTS.md — Module work protocol (candidate-browse)

## Before changing anything

1. No cross-module internal imports. Consumers import from `@nid/module-candidate-browse`.
2. Read [[CONTEXT.md]] for the guardrails — they are the reason this module exists and must not be weakened.

## Guardrails you must never weaken

- **Do not add a `cgpa` / `fitScore` / `score` / `match` sort option.** The `CandidateSort` union is `'name' | 'discipline' | 'batch'`. Adding a ranking option is a plan violation (AI-as-judge is forbidden).
- **Do not add a bulk-shortlist function.** `shortlistCandidate` is single-student by design. No `shortlistMany`, no "select all".
- **Do not make the recruiter note optional.** A non-empty note is required to shortlist — it forces individual evaluation.
- **Do not expose demographic fields** (gender, region, caste, religion) on the candidate view. They are not on the type. Do not add them.
- **Do not bypass discipline filtering.** Eligible candidates are strictly those whose discipline is in the JD's `targetDisciplineIds`. No "show all students" escape hatch on the recruiter side.

## When adding student data

- Students are seed data in `src/students.ts` for this slice. When the DB + portfolio.nid.edu ingest land, students come from the DB and portfolios from the ingest pipeline. Keep the seed shape aligned with the `@nid/core` Student entity.

## When validating input

- `shortlistCandidate` validates the note is non-empty before persisting. No raw casts.

## When testing

- The discipline-filter is the load-bearing logic. Test: a JD targeting [interaction-design, product-design] returns only those students, excludes communication-design / graphic-design students, and excludes students who didn't opt into the cycle.

Read [[CONTEXT.md]] next.
