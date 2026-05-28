# CONTEXT.md — interview-console module knowledge

> Read after [[AGENTS.md]].

## Why a separate module

The interview-day console is a distinct *context* (Phase 6.5): mobile-first, time-critical, used standing up with a phone, with its own transport concerns and a learn-the-UI demo. It composes data the recruiter already created (slot assignments) into a real-time-shaped view. Isolating it keeps the mobile concerns + transport prefs + demo out of the desktop browse/shortlist surfaces.

## The view model

`InterviewDayView`:
- `isDemo: boolean` — true when showing the sandboxed sample (no real assignments).
- `nowInterviewing?: QueueEntry` — the active candidate.
- `upNext: QueueEntry[]` — ordered queue.
- `runningLateMinutes: number` — schedule slippage (0 if on time).

`QueueEntry`:
- `studentName`, `disciplineName`, `round` (e.g. "Round 2 of 3"), `scheduledTime`.
- `conflict: { inAnotherInterview: boolean; etaBack?: string }` — anonymized cross-interview signal.

## Cross-interview conflict (anonymized)

In production, this is derived from other recruiters' slot end-times for the same student in the same window. With one demo recruiter, the demo dataset hard-codes a couple of `inAnotherInterview` flags with ETAs so the feature is visible. The view model NEVER carries the competing recruiter's identity — only the boolean + ETA.

## Transport modes

`TransportMode = 'live' | 'periodic' | 'manual'`:
- `live` — SSE push (default). Instant status, slight battery cost.
- `periodic` — poll every 15s. Lower battery, better on flaky venue Wi-Fi.
- `manual` — pull-to-refresh only. Max battery, offline-friendly.

Stored per recruiter in the JSON prefs store. The actual SSE/poll wiring is a prototype realtime-layer concern; this module owns the *preference* + documents the behavior.

## Demo

The 90-second sandboxed demo shows 4 sample candidates (watermarked DEMO), with one mid-interview, two up-next (one flagged in-another-interview), and a running-late indicator. No writes. Re-runnable.

Read [[REFERENCES.md]], [[SKILLS.md]] next.
