# modules/jd-posting — Module Entry Point

> Scoped to the JD posting workflow (Phase 4.2). The structured-schema wizard, draft persistence, the pre-publish gate, and the immutable draft→moderation→published lifecycle. Load this file plus the four module markdowns when working here. Root context: [[../../CLAUDE.md]].

## What this module owns

The recruiter's JD authoring flow per Phase 4.2:

```
/recruiter/jds/new
  Step 1  Role basics (title, role-type, location, work-mode, positions, start date)
  Step 2  Compensation (range for full-time; single stipend for internships; GP-fee ack)
  Step 3  Skills (multi-select from canonical taxonomy, required/preferred)
  Step 4  Responsibilities (categorized: Discovery / Definition / Design / Delivery / Ops)
  Step 5  Deliverables + success criteria
  Step 6  Supplementary prose (optional)
  Step 7  Interview rounds (count + per-round focus)
        │
        ▼
  Pre-publish gate (deterministic stipend-floor check; AI analyzer lands in a later slice)
        │
        ▼
  Save as draft  OR  Submit for moderation
```

JDs are **immutable after publish** (Phase 4.2). Any change to a published JD creates a new JD chained via `replacesJdId`. In this slice we cover draft + in-moderation; publish happens through admin moderation (a later slice).

## What this module does NOT own

- The AI JD analyzer / scope-creep classifier (Python ML worker, later slice). Until then the pre-publish gate runs the deterministic stipend-floor check with `scopeCreepMultiplier = 1`.
- Admin moderation of submitted JDs (`/admin/jds`, a later slice).
- Candidate browse, shortlisting, slot booking, offers (separate modules).
- Real DB persistence — JSON-backed mock store like recruiter-onboarding. Swap behind the public API later.
- Auth — the recruiter portal is scoped to a fixed demo recruiter until the auth module lands.

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public module API. Cross-module imports come through here only. |
| `src/types.ts` | Zod schemas + module-local types (built on `@nid/core` Jd entity). |
| `src/store.ts` | JSON-backed mock JD store. |
| `src/skills.ts` | Canonical skill taxonomy seed for the multi-select. |
| `src/stipend-floors.ts` | Stipend-floor matrix seed (programme × role-type). |
| `src/actions.ts` | Use cases: createDraft, submitForModeration, listForRecruiter, getJd. |

Read [[AGENTS.md]] next.
