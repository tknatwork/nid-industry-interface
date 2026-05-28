import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { JdRecord } from './types';

/**
 * JSON-backed mock JD store for this slice. Same swap-later pattern as the
 * recruiter-onboarding module: callers use the public API in index.ts; the
 * DB-backed implementation replaces this file without callers changing.
 */

interface StoreState {
  readonly jds: Record<string, JdRecord>;
  readonly counter: number;
}

function dataFilePath(): string {
  return resolve(process.cwd(), '.dev-data', 'jd-posting.json');
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return { jds: {}, counter: 0 };
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return { jds: parsed.jds ?? {}, counter: parsed.counter ?? 0 };
  } catch {
    return { jds: {}, counter: 0 };
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

export function insertJd(record: Omit<JdRecord, 'id'>): JdRecord {
  const state = loadState();
  const nextCounter = state.counter + 1;
  const id = `jd_${nextCounter.toString().padStart(5, '0')}`;
  const full: JdRecord = { ...record, id };
  persist({ jds: { ...state.jds, [id]: full }, counter: nextCounter });
  return full;
}

export function updateJd(id: string, patch: Partial<JdRecord>): JdRecord | null {
  const state = loadState();
  const current = state.jds[id];
  if (!current) return null;
  const updated: JdRecord = { ...current, ...patch, id: current.id };
  persist({ ...state, jds: { ...state.jds, [id]: updated } });
  return updated;
}

export function getJdById(id: string): JdRecord | null {
  return loadState().jds[id] ?? null;
}

export function listJdsForRecruiter(recruiterId: string): readonly JdRecord[] {
  return Object.values(loadState().jds)
    .filter((j) => j.recruiterId === recruiterId)
    .sort((a, b) => b.draftedAt.localeCompare(a.draftedAt));
}

export function listJdsByStatus(status: JdRecord['status']): readonly JdRecord[] {
  return Object.values(loadState().jds)
    .filter((j) => j.status === status)
    .sort((a, b) => (b.submittedAt ?? b.draftedAt).localeCompare(a.submittedAt ?? a.draftedAt));
}
