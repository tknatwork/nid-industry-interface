# CONTEXT.md — candidate-browse module knowledge

> Read after [[AGENTS.md]].

## Why this module exists separately + why the guardrails live here

Candidate browse is where the institution's values about merit and subjectivity become enforceable code. Design evaluation is subjective — a student without the "expected" credential often surprises a recruiter with their portfolio. So the product deliberately refuses to rank students or let recruiters sort by proxy metrics. Concentrating that refusal in one module (the only place recruiters view students) makes it auditable: if the guardrails hold here, they hold everywhere.

## The eligibility query

A candidate is eligible for a JD when:
- `student.disciplineId ∈ jd.targetDisciplineIds` (the admin-confirmed discipline mapping), AND
- the student opted into the JD's cycle.

That's it. No score threshold, no CGPA cutoff at the browse layer (eligibility rules like CGPA floors, if any, are applied upstream when students opt in — not as a recruiter-side filter/sort).

## Sort options (exhaustive)

`CandidateSort = 'name' | 'discipline' | 'batch'`. There is no fourth option. This is intentional and load-bearing. CGPA, fit-score, AI-match, and any demographic facet are absent by design.

## Portfolio handling (matches portfolio.nid.edu reality)

`portfolio.nid.edu` has no per-student pages — it routes to external portfolios (Behance/Issuu/personal). So each student carries an external `portfolioUrl`. The grid renders a **discipline-colored placeholder tile** with the student's name + discipline until the ingest pipeline (later slice) supplies re-encoded WebP thumbnails. The detail view links out to the external portfolio via an IPR-respecting modal (the link-out, not an embed).

## Shortlist

- One student at a time. `shortlistCandidate({ jdId, studentId, note })` with a required note.
- The shortlist is per-JD. `listShortlist(jdId)` returns the recruiter's individually-chosen students with their notes.
- Inviting shortlisted students to interview rounds, slot booking, and offers are later modules. This module stops at "shortlisted with a note".

## Mock students

Seeded across disciplines so filtering is demonstrable:
- interaction-design + product-design students → eligible for the seeded Product Designer JD (jd_00001).
- communication-design + graphic-design students → NOT eligible for that JD (proves filtering).
- One student deliberately NOT opted-in → proves the opt-in gate.

Read [[REFERENCES.md]] next.
