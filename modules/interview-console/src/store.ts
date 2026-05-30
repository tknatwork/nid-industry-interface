import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { syncKv } from '@nid/db';
import { dirname, resolve } from 'node:path';
import type {
  CandidateDecision,
  CoordinationSignal,
  RoundOutcome,
  RoundProgress,
  RoundResult,
  TransportMode,
} from './types';

interface StoreState {
  /** recruiterId → transport preference */
  readonly transport: Record<string, TransportMode>;
  /** `${jdId}::${studentId}` → persisted round-progress record */
  readonly roundProgress: Record<string, RoundProgress>;
  /** jdId → interviews-complete ("Done & Dusted") flag */
  readonly interviewsComplete: Record<string, boolean>;
}

const EMPTY_STATE: StoreState = { transport: {}, roundProgress: {}, interviewsComplete: {} };

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
  return { jdId, studentId, currentRound: 1, perRound: [], decision: 'pending', coordination: DEFAULT_COORDINATION };
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
