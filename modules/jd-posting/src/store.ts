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
  if (!existsSync(file)) return seedInitialState();
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return { jds: parsed.jds ?? {}, counter: parsed.counter ?? 0 };
  } catch {
    return seedInitialState();
  }
}

/**
 * Seed one in-moderation JD (so the admin queue has content) + one draft,
 * both owned by the demo recruiter Acme Design Studio (NID-2026-A-0001).
 * Matches the recruiter-onboarding seed pattern.
 */
function seedInitialState(): StoreState {
  const now = new Date();
  const isoYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const isoTwoHours = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

  const jds: Record<string, JdRecord> = {
    jd_00001: {
      id: 'jd_00001',
      recruiterId: 'NID-2026-A-0001',
      cycleId: 'cycle_spring_2026',
      status: 'in-moderation',
      title: 'Product Designer',
      roleType: 'full-time',
      location: 'Bengaluru',
      workMode: 'hybrid',
      positions: 2,
      baseMinPaise: 90_000_000, // ₹9.0L p.a. in paise
      baseMaxPaise: 140_000_000, // ₹14.0L p.a. in paise
      targetProgrammes: ['masters'],
      targetDisciplineIds: [],
      skills: [
        { slug: 'user-research', required: true },
        { slug: 'interaction-design', required: true },
        { slug: 'design-systems', required: true },
        { slug: 'figma', required: true },
        { slug: 'prototyping', required: false },
      ],
      responsibilities: {
        discovery: ['Run generative research with users and stakeholders'],
        design: ['Own end-to-end product flows', 'Maintain the design system'],
        delivery: ['Partner with engineering through handoff'],
      },
      deliverables: ['Validated product flows', 'Design-system contributions'],
      interviewRounds: [
        { round: 1, focus: 'Portfolio review' },
        { round: 2, focus: 'Design exercise' },
        { round: 3, focus: 'Culture + leadership' },
      ],
      gpFeeAcknowledged: false,
      draftedAt: isoYesterday,
      submittedAt: isoTwoHours,
    },
    jd_00002: {
      id: 'jd_00002',
      recruiterId: 'NID-2026-A-0001',
      cycleId: 'cycle_spring_2026',
      status: 'draft',
      title: 'Motion Design Intern',
      roleType: 'vacation-internship',
      location: 'Remote',
      workMode: 'remote',
      positions: 1,
      stipendPaise: 3_000_000, // ₹30k/mo in paise
      targetProgrammes: ['masters'],
      targetDisciplineIds: [],
      skills: [{ slug: 'motion-design', required: true }],
      responsibilities: {},
      deliverables: [],
      interviewRounds: [],
      gpFeeAcknowledged: true,
      draftedAt: isoTwoHours,
    },
  };

  const state: StoreState = { jds, counter: 2 };
  persist(state);
  return state;
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
