# REFERENCES.md — slot-booking pointers

## Plan sections
- Phase 4.6 (slot booking — admin publishes, recruiter books)
- Phase 6.11c (no meeting-platform integration; recruiter pastes own link)

## Entities consumed from `@nid/core`
- `SlotId`, `JdId`, `StudentId`, `CycleId` (id types)

## Sibling modules
- `candidate-browse` — supplies the shortlist (only shortlisted students are assignable)
- `interview-console` (next) — reads slot assignments to drive the day-of queue
- `jd-posting` — supplies the JD + cycle

## File map
- `src/index.ts` / `src/types.ts` / `src/store.ts` (`.dev-data/slot-booking.json`) / `src/actions.ts`

NOTE: mock data lives at `apps/web/.dev-data/` under `pnpm --filter web dev` (cwd-based).
