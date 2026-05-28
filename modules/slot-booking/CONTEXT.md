# CONTEXT.md — slot-booking module knowledge

> Read after [[AGENTS.md]].

## The admin-owns-supply model

Per Phase 4.6, the placement cell opens interview-day slots (which days, which time blocks, how many candidates per block). Recruiters then book from that published supply. This keeps the institution in control of the interview calendar — recruiters can't unilaterally demand arbitrary times, and the cell can balance load across companies + disciplines.

## Entities

- **Slot** — admin-published. `{ id, cycleId, day (ISO date), startTime, endTime (HH:MM), capacity, disciplineHint?, status }`. Status is `open` once published.
- **SlotAssignment** — recruiter-created. `{ jdId, slotId, studentId, meetingLinkUrl?, assignedAt }`. Links a shortlisted student to a slot.

## Invariants

1. `assignStudent` rejects if the slot already has `capacity` assignments.
2. A student holds at most one slot per JD — assigning again moves them (removes the old assignment).
3. Only shortlisted students can be assigned (the caller passes the shortlist; this module trusts the caller's list — the recruiter UI only offers shortlisted students).

## Seed

Admin publishes ~6 slots across two interview days (1–2 June 2026) with capacity 4 each, so the recruiter has slots to book against jd_00001's shortlist.

## Meeting link

The recruiter pastes their own joining link (Zoom/Meet/whatever) per slot. We store the string. No platform integration (Phase 6.11c). The student sees the link in their slot notification (later, when student-side lands).

Read [[REFERENCES.md]], [[SKILLS.md]] next.
