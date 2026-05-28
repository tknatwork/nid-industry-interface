import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ShortlistEntry } from './types';
import { SEED_STUDENTS, type SeedStudent } from './students';

/**
 * Student data is read-only seed for this slice. Only the shortlist is
 * mutable, so the JSON store holds shortlist entries; students come from
 * the seed module. Swap-later pattern as elsewhere.
 */

interface StoreState {
  readonly shortlist: readonly ShortlistEntry[];
}

function dataFilePath(): string {
  return resolve(process.cwd(), '.dev-data', 'candidate-browse.json');
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return { shortlist: [] };
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return { shortlist: parsed.shortlist ?? [] };
  } catch {
    return { shortlist: [] };
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

export function allStudents(): readonly SeedStudent[] {
  return SEED_STUDENTS;
}

export function studentById(studentId: string): SeedStudent | null {
  return SEED_STUDENTS.find((s) => s.studentId === studentId) ?? null;
}

export function addShortlist(entry: ShortlistEntry): void {
  const state = loadState();
  // Replace any existing entry for the same (jd, student) — re-shortlist updates the note.
  const filtered = state.shortlist.filter(
    (e) => !(e.jdId === entry.jdId && e.studentId === entry.studentId),
  );
  persist({ shortlist: [...filtered, entry] });
}

export function removeShortlist(jdId: string, studentId: string): void {
  const state = loadState();
  persist({ shortlist: state.shortlist.filter((e) => !(e.jdId === jdId && e.studentId === studentId)) });
}

export function shortlistForJd(jdId: string): readonly ShortlistEntry[] {
  return loadState()
    .shortlist.filter((e) => e.jdId === jdId)
    .slice()
    .sort((a, b) => a.shortlistedAt.localeCompare(b.shortlistedAt));
}

export function isShortlisted(jdId: string, studentId: string): boolean {
  return loadState().shortlist.some((e) => e.jdId === jdId && e.studentId === studentId);
}
