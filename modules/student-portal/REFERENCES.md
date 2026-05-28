# REFERENCES.md — student-portal pointers

## Plan sections

- **Phase 3.5** — Student portal (light) IA: the `/student/*` route map this module implements.
- **Phase 4.8** — Offer cascade: the wave model the offer inbox feeds (accept/decline → cascade).
- **Phase 2** — Design principle "student opt-in" (opt-in is student-controlled) and "merit + subjectivity respected" (no ranking on either side).

## Related modules (consumed through their public API)

- `@nid/module-candidate-browse` — `getCandidate` (student roster/profile), and the shortlist read model the tracker page composes (`listShortlist` / `isShortlisted`).
- `@nid/module-jd-posting` — `listJdsByStatus('published')` (the feed source), `getJd` (tracker detail).
- `@nid/module-slot-booking` — `listAssignmentsForJd` / `slotById` (the tracker's interview-slot row).
- `@nid/module-offer-cascade` — `listOffers` (inbox) + `recordResponse` (the real accept/decline write).

## Web surfaces that compose this module

- `apps/web/app/student/page.tsx` — dashboard
- `apps/web/app/student/cycles/page.tsx` (+ `actions.ts`) — opt-in toggle
- `apps/web/app/student/jds/page.tsx` — eligible feed
- `apps/web/app/student/applications/page.tsx` — tracker (composition root)
- `apps/web/app/student/offers/page.tsx` (+ `actions.ts`) — real offer inbox
- `apps/web/lib/demo-student.ts` — fixed demo student until auth lands
- `packages/ui` — `StudentShell` chrome atom

## External / future

- Auth + SSO from `nid.edu` (Phase 3.1) — replaces `demo-student.ts`.
- `@nid/db` `students` + `cycle_opt_in` tables — replace the JSON store and unify opt-in across surfaces.
