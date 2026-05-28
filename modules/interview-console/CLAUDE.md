# modules/interview-console — Module Entry Point

> Scoped to the interview-day mobile console (Phase 4.7). Root context: [[../../CLAUDE.md]].

## What this module owns

The day-of console the recruiter uses on their phone during interview windows:

```
/recruiter/jds/<jdId>/interviews  (mobile-first)
  • Now interviewing — current candidate + round
  • Up next — queue, each with an anonymized cross-interview-conflict ETA
  • Running-late indicator
  • Transport-mode settings (Live SSE / Periodic / Manual) — recruiter-selectable
  • 90-second sandboxed DEMO so recruiters can learn the UI without real data
  • Day-of actions: advance round · ping coordinator · raise issue
```

## Design stance (Phase 4.7 / 6.5)

- **Mobile-first.** This is the canonical mobile surface — recruiters hold a phone during interviews.
- **Transport is recruiter-selectable**, not fixed: Live push (SSE), Periodic refresh, or Manual. Default SSE.
- **Cross-interview conflict is anonymized** — the recruiter sees "in another interview, ETA ~15:45", never which competitor.
- **Sandboxed demo** runs on the real UI with sample data watermarked DEMO; no writes, no audit entries.

## What this module does NOT own

- Slot supply / assignment (slot-booking module). This module READS assignments to build the queue.
- Offers (offer-cascade module).
- Real-time transport implementation (SSE wiring lands with the prototype's realtime layer; for now the view model is computed server-side and the transport setting is a stored preference + documented behavior).

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API. |
| `src/types.ts` | InterviewDayView, QueueEntry, TransportMode. |
| `src/demo.ts` | The sandboxed DEMO dataset (watermarked). |
| `src/store.ts` | Transport-preference store (JSON). |
| `src/actions.ts` | buildInterviewDayView / getTransportMode / setTransportMode. |

Read [[AGENTS.md]], [[CONTEXT.md]], [[REFERENCES.md]], [[SKILLS.md]] next.
