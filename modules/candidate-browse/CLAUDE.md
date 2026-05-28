# modules/candidate-browse — Module Entry Point

> Scoped to the recruiter's candidate browse + individual shortlist (Phase 4.4 + 4.5). Portfolio-first, discipline-filtered, merit-respecting. Root context: [[../../CLAUDE.md]].

## What this module owns

The recruiter viewing students against a published JD:

```
/recruiter/jds/<jdId>/applicants
  Portfolio-first grid — only students whose discipline ∈ JD.targetDisciplineIds
                         AND who opted into the cycle
  Sort: name | discipline | batch    (NEVER cgpa / fit-score / demographic)
        │
        ▼
  Candidate detail — portfolio link-out (IPR modal), CV, statement of intent
        │
        ▼
  Individual shortlist — one student at a time, recruiter note REQUIRED
                         (no bulk select, no "shortlist top N")
```

## The guardrails this module enforces (non-negotiable, from the plan)

1. **Discipline filtering** — a recruiter browsing a "Product Designer" JD sees only students in the JD's confirmed target disciplines. The admin set those at moderation; this module reads them.
2. **No fit-scoring / AI ranking** — there is no scoring surface. The sort union type is `'name' | 'discipline' | 'batch'`; cgpa / fit / demographic options are unrepresentable.
3. **No bulk shortlisting** — `shortlistCandidate` takes one student id. There is no batch API.
4. **Note required** — shortlisting requires a non-empty recruiter note.
5. **Portfolio-first** — the grid leads with the portfolio thumbnail; CV is secondary.
6. **Student opt-in** — only cycle-opted-in students appear.

## What this module does NOT own

- The portfolio.nid.edu ingestion pipeline (later slice). Until then, students carry an external `portfolioUrl` (Behance/Issuu/personal) and the grid renders a discipline-colored placeholder tile, matching the real portfolio.nid.edu reality (it has no per-student pages, only external links).
- Interview slot booking, offers (separate modules).
- Real DB persistence — JSON-backed mock store; swap-later pattern.

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API. |
| `src/types.ts` | CandidateView, ShortlistEntry, the sort union. |
| `src/students.ts` | Mock student seed across disciplines. |
| `src/store.ts` | JSON-backed shortlist store + student lookup. |
| `src/actions.ts` | listEligibleCandidates / getCandidate / shortlistCandidate / listShortlist. |

Read [[AGENTS.md]] next.
