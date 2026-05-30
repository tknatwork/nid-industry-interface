// @nid/module-interview-console — public API.

export {
  buildInterviewDayView,
  getTransportMode,
  setTransportMode,
  recordRoundOutcome,
  getCandidateRounds,
  listRoundProgressForJd,
  setCoordinationSignal,
  setCandidateDecision,
  setInterviewsComplete,
  getInterviewsComplete,
  listSelected,
  listRejected,
  // Round 4 §C — interview plan (Before)
  getInterviewPlan,
  seedPlanFromJd,
  saveInterviewPlan,
  lockInterviewPlan,
  overridePlanAssignment,
  // Round 4 §C — round advancement + tally (During / After)
  advanceRound,
  candidatesForRound,
  computeTally,
  // Round 4 §C — offer-decision letter (After)
  getLetter,
  writeLetter,
} from './actions';
export type { PlanSeed } from './actions';
export type {
  InterviewDayView,
  QueueEntry,
  ConflictSignal,
  TransportMode,
  RoundOutcome,
  CandidateDecision,
  Attendance,
  RoundResult,
  CoordinationSignal,
  RoundProgress,
  RoundOutcomeInput,
  CoordinationSignalInput,
  // Round 4 §C
  InterviewPlan,
  PlanRound,
  PlanSlot,
  PlanAssignment,
  TallyRow,
  Letter,
  LetterInput,
  LettersMap,
} from './types';
export { planDraftSchema, planOverrideSchema } from './plan-schema';
export type { PlanDraft, PlanOverride } from './plan-schema';
