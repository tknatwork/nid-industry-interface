import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Per-cycle opt-in is the only state the student portal owns (Phase 2: student
 * opt-in is student-controlled). Everything else the portal shows is a read
 * model from candidate-browse (profile) and jd-posting (published JDs).
 *
 * Keyed `${studentId}::${cycleId}` → true. Absence = not opted in. JSON-backed
 * mock like the other modules; swaps for the DB `cycle_opt_in` table later.
 *
 * NOTE (documented seam): the recruiter-side candidate-browse currently reads
 * opt-in from its own seed array, not from this store. Unifying the two — so a
 * student toggling opt-in here removes them from recruiter browse — belongs in
 * the @nid/db layer where both surfaces read one `students`/`opt_in` source.
 * Until then, this store is authoritative for the *student's own* feed only.
 */

interface StoreState {
  readonly optIns: Readonly<Record<string, boolean>>;
}

const SPRING = 'cycle_spring_2026';

function key(studentId: string, cycleId: string): string {
  return `${studentId}::${cycleId}`;
}

function dataFilePath(): string {
  return resolve(process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(process.cwd(), '.dev-data'), 'student-portal.json');
}

function seedInitialState(): StoreState {
  // Aanya Roy (stu_0005) is opted into Spring 2026 — matches the seeded
  // shortlist + pending offer so the demo lands on a populated inbox.
  return { optIns: { [key('stu_0005', SPRING)]: true } };
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return seedInitialState();
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return { optIns: parsed.optIns ?? {} };
  } catch {
    return seedInitialState();
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

export function isOptedIn(studentId: string, cycleId: string): boolean {
  return loadState().optIns[key(studentId, cycleId)] === true;
}

export function setOptIn(studentId: string, cycleId: string, optedIn: boolean): void {
  const state = loadState();
  const next: Record<string, boolean> = { ...state.optIns };
  if (optedIn) next[key(studentId, cycleId)] = true;
  else delete next[key(studentId, cycleId)];
  persist({ optIns: next });
}
