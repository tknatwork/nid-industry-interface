# REFERENCES.md — recruiter-engagement pointers

## Plan sections

- **Phase 4.3** — Pre-Placement Talk scheduling (admin-published windows, deck upload, agenda, post-PPT interest signal).
- **Phase 4.12** — Scheduling a meeting with the placement head (open slots, auto-attached agenda template, action items).
- **Phase 6.11c** — no central meeting-platform integration; recruiter pastes their own link.

## Related modules

- `@nid/module-slot-booking` — sibling "book an admin window" pattern, but for interview-day slots (distinct supply).
- `@nid/module-recruiter-onboarding` — owns the recruiter identity these bookings belong to.

## Web surfaces that compose this module

- `apps/web/app/recruiter/ppt/page.tsx` (+ `actions.ts`)
- `apps/web/app/recruiter/meetings/page.tsx` (+ `actions.ts`)
- `packages/ui` `RecruiterShell` — reached from the dashboard / help links.

## Future

- Admin publishing UI for windows + slots (currently seeded).
- Comms fan-out to eligible students + coordinators on PPT confirmation (Phase 5.6).
- `@nid/db` `ppt_windows` / `meeting_slots` tables replace the JSON store.
