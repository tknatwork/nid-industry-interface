import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { syncKv } from '@nid/db';
import { dirname, resolve } from 'node:path';
import type { PipelineState } from './types';

interface StoreState {
  /** jdId → that JD's linear pipeline (stage + per-stage timestamps + audit). */
  readonly pipelines: Record<string, PipelineState>;
  /** Monotonic counter backing stable, ordered audit-entry ids. */
  readonly counter: number;
}

const EMPTY_STATE: StoreState = { pipelines: {}, counter: 0 };

function dataFilePath(): string {
  return resolve(process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(process.cwd(), '.dev-data'), 'recruiter-pipeline.json');
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return EMPTY_STATE;
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return { pipelines: p.pipelines ?? {}, counter: p.counter ?? 0 };
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
  syncKv('recruiter-pipeline', state);
}

/**
 * A JD that has no persisted pipeline yet is treated as freshly `published`
 * (its entry stage) with an empty audit trail. We do NOT persist on read — the
 * record materializes lazily the first time a mutation lands.
 */
function freshPipeline(jdId: string): PipelineState {
  return { jdId, stage: 'published', enteredAt: {}, audit: [] };
}

/** Read a JD's pipeline (or the implicit fresh `published` one if none exists). */
export function readPipeline(jdId: string): PipelineState {
  return loadState().pipelines[jdId] ?? freshPipeline(jdId);
}

/**
 * Replace a JD's pipeline wholesale and bump the audit-id counter. Callers
 * assemble the next immutable `PipelineState` (append-only audit, forward-only
 * stage) and hand it here; the store stays dumb persistence.
 */
export function writePipeline(next: PipelineState, nextCounter: number): PipelineState {
  const state = loadState();
  persist({
    pipelines: { ...state.pipelines, [next.jdId]: next },
    counter: nextCounter,
  });
  return next;
}

/** Current audit-id counter — callers reserve the next id(s) before writing. */
export function readCounter(): number {
  return loadState().counter;
}

/** Mint a stable, ordered audit-entry id from a counter value. */
export function auditIdFor(n: number): string {
  return `audit_${n.toString().padStart(6, '0')}`;
}
