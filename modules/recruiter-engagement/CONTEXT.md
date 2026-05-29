# CONTEXT.md — recruiter-engagement knowledge

## Entities

- **PptWindow** — admin-published Pre-Placement Talk slot (day/time/mode/campus). `status` flips open→booked.
- **PptBooking** — a recruiter's booking of a window + deck link + agenda + (optional) meeting link.
- **MeetingSlot** — a placement-head's open slot. `status` flips open→booked.
- **Meeting** — a recruiter's booked meeting + agenda (seeded from `DEFAULT_MEETING_AGENDA`) + note.

## Invariants

1. **No double-booking.** A window/slot can be booked once; the action checks `status === 'open'` before inserting and flips it in the same persist.
2. **Recruiter brings the link.** The PPT booking stores the recruiter's pasted `meetingLinkUrl` verbatim; the portal never generates or rewrites it.
3. **Agenda is never empty.** `bookMeeting` requires ≥1 agenda item; the UI pre-fills `DEFAULT_MEETING_AGENDA`.

## Decisions / gotchas

- **PPT + meetings share one module + one store** deliberately — both are "book an admin window, paste your own link." This is not a grab-bag; they are the same interaction shape against different supply.
- **Admin publishing is seeded, not a UI.** For the demo, windows + slots are seeded open in `store.ts`. A real admin publishing surface is a later slice; the recruiter-facing booking is the functioning half.
- **Reset:** clearing `apps/web/.dev-data/recruiter-engagement.json` re-seeds the open windows/slots (drops any demo bookings).

## Audit-log fields (when the audit adapter lands)

`module: 'recruiter-engagement'`, `action: 'ppt.booked' | 'meeting.booked'`, `actorType: 'recruiter'`, `actorId: recruiterId`, plus `windowId`/`slotId`.
