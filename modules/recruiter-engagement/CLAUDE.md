# modules/recruiter-engagement — Module Entry Point

> Scoped to the recruiter ↔ placement-cell **scheduling touchpoints**: Pre-Placement Talks (Phase 4.3) and placement-head meetings (Phase 4.12). Two concerns, one module — both are "book an admin-published window, bring your own link." Root context: [[../../CLAUDE.md]].

## What this module owns

```
/recruiter/ppt        Pick an admin-published PPT window (virtual / on-campus)
                      → paste deck link + agenda → booked (window flips to taken)
/recruiter/meetings   Pick a placement-head slot → DEFAULT_MEETING_AGENDA auto-attached
                      → optionally add items → scheduled
```

Admin owns the supply (windows/slots — seeded here for the demo); the recruiter
consumes it. The recruiter **pastes their own meeting link** — there is no
meeting-platform integration (Phase 6.11c). This module stores the link string only.

## What this module does NOT own

- Interview slot booking (that's `@nid/module-slot-booking`) — PPTs and meetings are
  distinct from interview-day slots.
- The comms layer that notifies students of a confirmed PPT (later slice).
- Real DB / real calendar — JSON-backed mock store, swap-later.
- Admin-side publishing UI for windows/slots — seeded directly for the demo.

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API. |
| `src/types.ts` | PptWindow/PptBooking/MeetingSlot/Meeting + Zod + DEFAULT_MEETING_AGENDA. |
| `src/store.ts` | JSON store; seeds open PPT windows + meeting slots. |
| `src/actions.ts` | listPptWindows/bookPpt · listMeetingSlots/bookMeeting (+ list bookings). |

Read [[AGENTS.md]], [[CONTEXT.md]], [[REFERENCES.md]], [[SKILLS.md]] next.
