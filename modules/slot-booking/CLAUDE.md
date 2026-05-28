# modules/slot-booking — Module Entry Point

> Scoped to interview slot publishing + booking (Phase 4.6). Root context: [[../../CLAUDE.md]].

## What this module owns

```
Admin publishes interview-day slots for the cycle  (/admin/slots)
        │  day · time block · capacity · optional discipline hint
        ▼
Recruiter books open slots for a JD and assigns shortlisted candidates
        │  (/recruiter/jds/<jdId>/slots)
        ▼
Each assigned student holds a slot (assignment is per shortlisted student)
```

Key rule (Phase 4.6): **recruiters cannot create slots** — they book from the admin-published calendar. The admin owns slot supply; the recruiter consumes it. A slot's capacity caps how many students can be assigned to it.

## What this module does NOT own

- The interview-day console (separate module: interview-console).
- Offers (separate module).
- Real DB persistence — JSON-backed mock store; swap-later.
- The recruiter pastes their own meeting link per booked slot (no platform integration — Phase 6.11c). This module stores the link string only.

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API. |
| `src/types.ts` | Slot, SlotAssignment, Zod schemas. |
| `src/store.ts` | JSON-backed store + admin-published slot seed. |
| `src/actions.ts` | publishSlot / listOpenSlots / bookSlot / assignStudent / listAssignmentsForJd. |

Read [[AGENTS.md]], [[CONTEXT.md]], [[REFERENCES.md]], [[SKILLS.md]] next.
