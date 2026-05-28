import { listAssignmentsForJd, slotById } from '@nid/module-slot-booking';
import { getCandidate } from '@nid/module-candidate-browse';
import type { InterviewDayView, QueueEntry, TransportMode } from './types';
import { DEMO_INTERVIEW_DAY } from './demo';
import { readTransport, writeTransport } from './store';

/**
 * Build the interview-day view from real slot assignments. If none exist,
 * return the sandboxed DEMO dataset (Phase 4.7) so the console is never empty.
 *
 * The conflict signal is anonymized — for real assignments it is currently
 * a deterministic mock (no second recruiter in the demo) and never carries
 * the competing recruiter's identity.
 */
export function buildInterviewDayView(jdId: string): InterviewDayView {
  const assignments = listAssignmentsForJd(jdId);
  if (assignments.length === 0) return DEMO_INTERVIEW_DAY;

  // Order assignments by slot day + start time.
  const enriched = assignments
    .map((a) => {
      const slot = slotById(a.slotId);
      const candidate = getCandidate(a.studentId);
      return slot && candidate ? { a, slot, candidate } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((x, y) => x.slot.day.localeCompare(y.slot.day) || x.slot.startTime.localeCompare(y.slot.startTime));

  const entries: QueueEntry[] = enriched.map((e, i) => ({
    studentId: e.candidate.studentId,
    studentName: e.candidate.name,
    disciplineName: e.candidate.disciplineName,
    round: 'Round 1',
    scheduledTime: e.slot.startTime,
    // Deterministic anonymized conflict mock: flag every 3rd up-next candidate.
    conflict: i > 0 && i % 3 === 0 ? { inAnotherInterview: true, etaBack: e.slot.startTime } : { inAnotherInterview: false },
  }));

  const [now, ...rest] = entries;
  return {
    isDemo: false,
    ...(now ? { nowInterviewing: now } : {}),
    upNext: rest,
    runningLateMinutes: 0,
  };
}

export function getTransportMode(recruiterId: string): TransportMode {
  return readTransport(recruiterId);
}

export function setTransportMode(recruiterId: string, mode: TransportMode): void {
  writeTransport(recruiterId, mode);
}
