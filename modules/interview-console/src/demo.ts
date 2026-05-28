import type { InterviewDayView } from './types';

/**
 * Sandboxed DEMO dataset (Phase 4.7). Shown when no real slot assignments
 * exist, so the recruiter can learn the console UI. Names are prefixed
 * "DEMO ·" and the view carries isDemo: true — the UI watermarks it and no
 * writes / audit entries occur.
 */
export const DEMO_INTERVIEW_DAY: InterviewDayView = {
  isDemo: true,
  runningLateMinutes: 12,
  nowInterviewing: {
    studentId: 'demo_now',
    studentName: 'DEMO · Meher Singh',
    disciplineName: 'Interaction Design',
    round: 'Round 2 of 3',
    scheduledTime: '14:00',
    conflict: { inAnotherInterview: false },
  },
  upNext: [
    {
      studentId: 'demo_1',
      studentName: 'DEMO · Riya Mishra',
      disciplineName: 'Interaction Design',
      round: 'Round 1 of 3',
      scheduledTime: '14:30',
      conflict: { inAnotherInterview: true, etaBack: '14:45' },
    },
    {
      studentId: 'demo_2',
      studentName: 'DEMO · Arnav Kulkarni',
      disciplineName: 'Interaction Design',
      round: 'Round 1 of 3',
      scheduledTime: '15:00',
      conflict: { inAnotherInterview: false },
    },
    {
      studentId: 'demo_3',
      studentName: 'DEMO · Aanya Roy',
      disciplineName: 'Product Design',
      round: 'Round 1 of 3',
      scheduledTime: '15:30',
      conflict: { inAnotherInterview: true, etaBack: '15:20' },
    },
  ],
};
