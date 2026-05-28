# AGENTS.md — Module work protocol (slot-booking)

## Rules

1. No cross-module internal imports; consumers use `@nid/module-slot-booking`.
2. **Recruiters never create slots.** There is no recruiter-facing `publishSlot`. Recruiters call `bookSlot` / `assignStudent` against admin-published slots only.
3. **Capacity is enforced.** `assignStudent` rejects when the slot is at capacity. No override.
4. A student can hold at most one slot per JD — re-assigning moves them.
5. Zod-validate all inputs; no raw casts. Times are stored as `HH:MM` strings, days as ISO dates.
6. The meeting link is a plain recruiter-pasted URL — do not validate it against any provider or call any platform API (Phase 6.11c: no meeting-platform integration).

## Testing priority

The capacity check + one-slot-per-student-per-JD invariant are the load-bearing rules — test those first.
