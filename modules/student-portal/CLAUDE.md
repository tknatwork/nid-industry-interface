# modules/student-portal — Module Entry Point

> Scoped to the light student portal (Phase 3.5). The student's self-service surface: per-cycle opt-in, the eligible-JD feed, the application tracker, and the **real** offer inbox that de-fakes the recruiter offers page's demo accept/decline. Root context: [[../../CLAUDE.md]].

## What this module owns

```
/student                 Dashboard — profile, opt-in status, counts
/student/cycles          Opt-in / opt-out of an open cycle  (student-controlled)
        │
        ▼
/student/jds             Eligible-JD feed
                         published  AND  opted-in  AND  discipline ∈ targets
                         AND programme ∈ targetProgrammes
        │
        ▼
/student/applications    Tracker — shortlist status · interview slot · offer
                         (composed at the page from candidate-browse + slot-booking + offer-cascade)
        │
        ▼
/student/offers          REAL offer inbox — accept / decline
                         calls offer-cascade.recordResponse → drives the wave cascade
```

The single piece of state this module **owns** is **per-cycle opt-in** (`src/store.ts`). It is student-controlled (Phase 2 principle). Everything else the portal renders is a read model composed from the recruiter-side modules' published outputs.

## What this module does NOT own

- **Student identity / roster** — read from `@nid/module-candidate-browse` (`getCandidate`). When the DB lands, both surfaces read one `students` table.
- **The offer cascade math + persistence** — `@nid/module-offer-cascade`. The offer inbox calls its `recordResponse`; it does not re-implement wave logic.
- **Shortlist + slot data** — owned by candidate-browse and slot-booking; the tracker page composes them read-only.
- **Auth** — the portal is scoped to a fixed demo student (`stu_0005`, Aanya Roy) until the auth/SSO module lands.
- **Redressal / conduct / jury-fork** (Phase 5) — separate later slices, not this light portal.
- **Real DB persistence** — JSON-backed opt-in store; swap-later pattern.

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API. Cross-module imports come through here only. |
| `src/types.ts` | StudentProfile, EligibleJd, Zod schemas (opt-in, offer response). |
| `src/store.ts` | JSON-backed per-cycle opt-in store (the only owned state). |
| `src/actions.ts` | getStudentProfile / isOptedIn / setCycleOptIn / listEligibleJds. |

Read [[AGENTS.md]], [[CONTEXT.md]], [[REFERENCES.md]], [[SKILLS.md]] next.
