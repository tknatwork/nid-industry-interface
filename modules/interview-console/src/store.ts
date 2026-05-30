import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { syncKv } from '@nid/db';
import { dirname, resolve } from 'node:path';
import type {
  CandidateDecision,
  InterviewPlan,
  Letter,
  LetterInput,
  PlanAssignment,
  RoundOutcome,
  RoundProgress,
  RoundResult,
  TallyRow,
  CoordinationSignal,
  TransportMode,
} from './types';

interface StoreState {
  /** recruiterId → transport preference */
  readonly transport: Record<string, TransportMode>;
  /** `${jdId}::${studentId}` → persisted round-progress record */
  readonly roundProgress: Record<string, RoundProgress>;
  /** jdId → interviews-complete ("Done & Dusted") flag */
  readonly interviewsComplete: Record<string, boolean>;
  /** jdId → frozen-once-locked interview plan (Round 4 §C Before) */
  readonly plans: Record<string, InterviewPlan>;
  /** jdId → sent offer-decision letter (Round 4 §C After) */
  readonly letters: Record<string, Letter>;
  /** Monotonic id counter for plan slot synthesis. */
  readonly planCounter: number;
}

const EMPTY_STATE: StoreState = {
  transport: {},
  roundProgress: {},
  interviewsComplete: {},
  plans: {},
  letters: {},
  planCounter: 0,
};

function progressKey(jdId: string, studentId: string): string {
  return `${jdId}::${studentId}`;
}

const DEFAULT_COORDINATION: CoordinationSignal = { inAnotherInterview: false, attendance: 'expected' };

function dataFilePath(): string {
  return resolve(process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(process.cwd(), '.dev-data'), 'interview-console.json');
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return EMPTY_STATE;
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return {
      transport: p.transport ?? {},
      roundProgress: p.roundProgress ?? {},
      interviewsComplete: p.interviewsComplete ?? {},
      plans: p.plans ?? {},
      letters: p.letters ?? {},
      planCounter: p.planCounter ?? 0,
    };
  } catch {
    return EMPTY_STATE;
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
  // Durable write-through (no-op without DATABASE_URL): mirror the full
  // state blob to Postgres so it survives serverless cold starts.
  syncKv('interview-console', state);
}

export function readTransport(recruiterId: string): TransportMode {
  return loadState().transport[recruiterId] ?? 'live';
}

export function writeTransport(recruiterId: string, mode: TransportMode): void {
  const state = loadState();
  persist({ ...state, transport: { ...state.transport, [recruiterId]: mode } });
}

// ── Round-progress persistence (§O/§Q/§R) ─────────────────────────────────

/** Map a round outcome to the derived per-candidate decision. */
function decisionFor(latest: RoundOutcome, prior: CandidateDecision): CandidateDecision {
  if (latest === 'reject') return 'rejected';
  // 'advance' / 'hold' keep the candidate in play; an explicit later "selected"
  // decision is set via the After-phase getters, so we only flip to rejected here.
  return prior === 'rejected' ? 'pending' : prior;
}

/** Build a fresh record so reads never return undefined for a known pair. */
function emptyProgress(jdId: string, studentId: string): RoundProgress {
  return {
    jdId,
    studentId,
    currentRound: 1,
    perRound: [],
    decision: 'pending',
    coordination: DEFAULT_COORDINATION,
    advancedThroughRound: 0,
  };
}

export function readRoundProgress(jdId: string, studentId: string): RoundProgress {
  return loadState().roundProgress[progressKey(jdId, studentId)] ?? emptyProgress(jdId, studentId);
}

export function readRoundProgressForJd(jdId: string): readonly RoundProgress[] {
  const prefix = `${jdId}::`;
  return Object.entries(loadState().roundProgress)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value);
}

export function writeRoundResult(jdId: string, studentId: string, result: RoundResult): RoundProgress {
  const state = loadState();
  const key = progressKey(jdId, studentId);
  const existing = state.roundProgress[key] ?? emptyProgress(jdId, studentId);

  // Forward-only per round: a round already advanced past is SEALED — refuse to
  // overwrite its outcome (closes the "re-score an advanced candidate to flip
  // them out" path). A correction within the current/open round is still allowed.
  if (result.round <= existing.advancedThroughRound) return existing;

  // Replace any prior entry for this round number; otherwise append.
  const perRound = [...existing.perRound.filter((r) => r.round !== result.round), result].sort((a, b) => a.round - b.round);
  const currentRound = perRound.reduce((max, r) => Math.max(max, r.round), 1);
  const next: RoundProgress = {
    ...existing,
    perRound,
    currentRound,
    decision: decisionFor(result.outcome, existing.decision),
  };
  persist({ ...state, roundProgress: { ...state.roundProgress, [key]: next } });
  return next;
}

export function writeDecision(jdId: string, studentId: string, decision: CandidateDecision): RoundProgress {
  const state = loadState();
  const key = progressKey(jdId, studentId);
  const existing = state.roundProgress[key] ?? emptyProgress(jdId, studentId);
  const next: RoundProgress = { ...existing, decision };
  persist({ ...state, roundProgress: { ...state.roundProgress, [key]: next } });
  return next;
}

export function writeCoordination(jdId: string, studentId: string, coordination: CoordinationSignal): RoundProgress {
  const state = loadState();
  const key = progressKey(jdId, studentId);
  const existing = state.roundProgress[key] ?? emptyProgress(jdId, studentId);
  const next: RoundProgress = { ...existing, coordination };
  persist({ ...state, roundProgress: { ...state.roundProgress, [key]: next } });
  return next;
}

export function readInterviewsComplete(jdId: string): boolean {
  return loadState().interviewsComplete[jdId] ?? false;
}

export function writeInterviewsComplete(jdId: string, complete: boolean): void {
  const state = loadState();
  persist({ ...state, interviewsComplete: { ...state.interviewsComplete, [jdId]: complete } });
}

// ── Interview-plan persistence (Round 4 §C Before) ────────────────────────

/** Read the stored plan for a JD, or null if none has been drafted yet. */
export function readPlan(jdId: string): InterviewPlan | null {
  return loadState().plans[jdId] ?? null;
}

/**
 * Persist a structural plan write. REFUSED once the existing plan is `locked`
 * — the locked plan is frozen and day-of changes must go through
 * `overridePlanAssignment` instead. Returns the persisted plan, or null when
 * the write is refused (caller surfaces "plan locked").
 *
 * The incoming `draft` carries only the editable surface (duration, rounds,
 * slots, assignments); `locked`/`lockedAt`/`updatedAt` are owned here.
 */
export function writePlan(
  jdId: string,
  draft: Pick<InterviewPlan, 'durationMin' | 'rounds' | 'slots' | 'assignments'>,
): InterviewPlan | null {
  const state = loadState();
  const existing = state.plans[jdId];
  if (existing?.locked) return null; // frozen — structural writes refused
  const next: InterviewPlan = {
    jdId,
    durationMin: draft.durationMin,
    rounds: draft.rounds,
    slots: draft.slots,
    assignments: draft.assignments,
    locked: false,
    updatedAt: new Date().toISOString(),
  };
  persist({ ...state, plans: { ...state.plans, [jdId]: next } });
  return next;
}

/**
 * Freeze the plan: flips `locked` true and stamps `lockedAt`. Idempotent — a
 * second lock is a no-op that returns the already-locked plan. Returns null if
 * no plan exists to lock.
 */
export function lockPlan(jdId: string): InterviewPlan | null {
  const state = loadState();
  const existing = state.plans[jdId];
  if (!existing) return null;
  if (existing.locked) return existing;
  const now = new Date().toISOString();
  const next: InterviewPlan = { ...existing, locked: true, lockedAt: now, updatedAt: now };
  persist({ ...state, plans: { ...state.plans, [jdId]: next } });
  return next;
}

/**
 * Override a single assignment cell — ALLOWED post-lock (this is the day-of
 * reassignment path). Replaces any existing assignment for the same
 * (studentId, round) pair; otherwise appends. The locked plan's structure
 * (rounds/slots/duration) is untouched. Returns the updated plan, or null if
 * no plan exists.
 */
export function overridePlanAssignment(jdId: string, assignment: PlanAssignment): InterviewPlan | null {
  const state = loadState();
  const existing = state.plans[jdId];
  if (!existing) return null;
  if (!existing.locked) return null; // day-of overrides are a POST-lock path only
  const assignments = [
    ...existing.assignments.filter(
      (a) => !(a.studentId === assignment.studentId && a.round === assignment.round),
    ),
    assignment,
  ];
  const next: InterviewPlan = { ...existing, assignments, updatedAt: new Date().toISOString() };
  persist({ ...state, plans: { ...state.plans, [jdId]: next } });
  return next;
}

// ── Round advancement + tally (Round 4 §C During / After) ─────────────────

/** The latest recorded outcome for a candidate at a given round, if any. */
function latestOutcomeAtRound(progress: RoundProgress, round: number): RoundOutcome | undefined {
  // perRound holds at most one entry per round (writeRoundResult dedupes).
  return progress.perRound.find((r) => r.round === round)?.outcome;
}

/**
 * "Shortlist round N → advance". For every candidate in this JD whose latest
 * outcome AT `round` is 'advance', set `advancedThroughRound = round` (they
 * surface in round N+1). Every other candidate who *participated* at this round
 * (has any perRound entry) but did not advance is bucketed `notAdvanced: true`.
 * Candidates with no activity at all are left untouched. Returns the updated
 * records for this JD.
 */
export function advanceRound(jdId: string, round: number): readonly RoundProgress[] {
  const state = loadState();
  const prefix = `${jdId}::`;
  const nextProgress: Record<string, RoundProgress> = { ...state.roundProgress };
  const touched: RoundProgress[] = [];

  for (const [key, progress] of Object.entries(state.roundProgress)) {
    if (!key.startsWith(prefix)) continue;
    const outcome = latestOutcomeAtRound(progress, round);
    if (outcome === undefined) continue; // no activity at this round — leave as-is

    let updated: RoundProgress;
    if (outcome === 'advance') {
      // Advance: bump the marker (never regress it) and clear any prior
      // not-advanced bucketing from an earlier pass. Rebuild explicitly so the
      // optional `notAdvanced` key is dropped (exactOptionalPropertyTypes —
      // never carry `notAdvanced: undefined`).
      updated = {
        jdId: progress.jdId,
        studentId: progress.studentId,
        currentRound: progress.currentRound,
        perRound: progress.perRound,
        decision: progress.decision,
        coordination: progress.coordination,
        advancedThroughRound: Math.max(progress.advancedThroughRound, round),
      };
    } else {
      // hold / reject at this round → did not advance.
      updated = { ...progress, notAdvanced: true };
    }
    nextProgress[key] = updated;
    touched.push(updated);
  }

  persist({ ...state, roundProgress: nextProgress });
  return touched;
}

/**
 * Candidates eligible to appear in `round`. Round 1 shows everyone with a
 * progress record for the JD; round N (N>1) shows only those advanced through
 * the prior round (`advancedThroughRound >= round - 1`) and not bucketed
 * `notAdvanced`.
 */
export function candidatesForRound(jdId: string, round: number): readonly RoundProgress[] {
  const all = readRoundProgressForJd(jdId);
  if (round <= 1) return all;
  return all.filter((p) => p.advancedThroughRound >= round - 1 && p.notAdvanced !== true);
}

/**
 * Compute the After-phase tally across rounds 1..finalRound. Each row carries
 * the per-round score (undefined where unscored), the summed total, and
 * whether the candidate has a recorded outcome at the final round. Restricted
 * to candidates who reached the final round (advanced through finalRound - 1),
 * so eliminated candidates do not pollute the tally; for finalRound 1 every
 * candidate with activity is included.
 */
export function computeTally(jdId: string, finalRound: number): readonly TallyRow[] {
  const pool = candidatesForRound(jdId, finalRound);
  return pool.map((p) => {
    const perRound: (number | undefined)[] = [];
    let total = 0;
    for (let r = 1; r <= finalRound; r += 1) {
      const score = p.perRound.find((x) => x.round === r)?.score;
      perRound.push(score);
      if (score !== undefined) total += score;
    }
    const reachedFinal = p.perRound.some((x) => x.round === finalRound);
    return { studentId: p.studentId, perRound, total, reachedFinal };
  });
}

// ── Offer-decision letters (Round 4 §C After) ─────────────────────────────

/** Read the sent letter for a JD, or null if none has been sent. */
export function readLetter(jdId: string): Letter | null {
  return loadState().letters[jdId] ?? null;
}

/**
 * Persist a sent offer-decision letter for a JD (latest send wins). Stamps
 * `sentAt`; omits absent optional fields entirely (exactOptionalPropertyTypes).
 */
export function writeLetter(jdId: string, input: LetterInput): Letter {
  const state = loadState();
  const letter: Letter = {
    sentAt: new Date().toISOString(),
    ...(input.noteMd !== undefined ? { noteMd: input.noteMd } : {}),
    ...(input.voiceTranscript !== undefined ? { voiceTranscript: input.voiceTranscript } : {}),
    ...(input.reviewStars !== undefined ? { reviewStars: input.reviewStars } : {}),
  };
  persist({ ...state, letters: { ...state.letters, [jdId]: letter } });
  return letter;
}
