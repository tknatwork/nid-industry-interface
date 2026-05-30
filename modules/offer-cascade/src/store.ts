import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { syncKv } from '@nid/db';
import { dirname, resolve } from 'node:path';
import type { FloatSequenceRecord, OfferRecord } from './types';

interface StoreState {
  readonly offers: readonly OfferRecord[];
  readonly counter: number;
  /** Locked float order, keyed by jdId. One-shot per JD. */
  readonly sequences: Record<string, FloatSequenceRecord>;
}

function dataFilePath(): string {
  return resolve(process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(process.cwd(), '.dev-data'), 'offer-cascade.json');
}

/**
 * Demo seed: Wave 1 offer already floated to Aanya Roy (stu_0005) against the
 * published full-time jd_00001 (₹9-14L band → ₹12L offer). Status pending, so
 * the student offer inbox can exercise a real accept/decline through
 * recordResponse, and the recruiter offers board shows a live wave. The offer
 * carries `sequenceIndex: 0` and a `deadlineIso` ~45h out (still live), and a
 * locked `sequences['jd_00001']` so the Round 4 sequence/deadline/auto-float
 * surfaces have real state on first load. Swap for a real read model later.
 */
function seedInitialState(): StoreState {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const deadlineIso = new Date(Date.now() + 45 * 60 * 60 * 1000).toISOString();
  return {
    offers: [
      {
        id: 'offer_00001',
        jdId: 'jd_00001',
        studentId: 'stu_0005',
        wave: 1,
        status: 'pending',
        ctcPaise: 120000000,
        issuedAt: threeHoursAgo,
        sequenceIndex: 0,
        deadlineIso,
      },
    ],
    counter: 1,
    sequences: {
      jd_00001: { jdId: 'jd_00001', order: ['stu_0005'], lockedAt: threeHoursAgo },
    },
  };
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return seedInitialState();
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return { offers: p.offers ?? [], counter: p.counter ?? 0, sequences: p.sequences ?? {} };
  } catch {
    return seedInitialState();
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
  // Durable write-through (no-op without DATABASE_URL): mirror the full
  // state blob to Postgres so it survives serverless cold starts.
  syncKv('offer-cascade', state);
}

export function offersForJd(jdId: string): readonly OfferRecord[] {
  return loadState()
    .offers.filter((o) => o.jdId === jdId)
    .sort((a, b) => a.wave - b.wave || a.issuedAt.localeCompare(b.issuedAt));
}

export function hasDeclined(jdId: string, studentId: string): boolean {
  return loadState().offers.some(
    (o) => o.jdId === jdId && o.studentId === studentId && o.status === 'declined',
  );
}

export function hasActiveOffer(jdId: string, studentId: string): boolean {
  return loadState().offers.some(
    (o) => o.jdId === jdId && o.studentId === studentId && (o.status === 'pending' || o.status === 'accepted'),
  );
}

export function currentMaxWave(jdId: string): number {
  return offersForJd(jdId).reduce((max, o) => Math.max(max, o.wave), 0);
}

export function insertOffer(record: Omit<OfferRecord, 'id'>): OfferRecord {
  const state = loadState();
  const n = state.counter + 1;
  const full: OfferRecord = { ...record, id: `offer_${n.toString().padStart(5, '0')}` };
  persist({ ...state, offers: [...state.offers, full], counter: n });
  return full;
}

export function updateOfferStatus(
  jdId: string,
  studentId: string,
  status: OfferRecord['status'],
  reason?: string,
): OfferRecord | null {
  const state = loadState();
  let updated: OfferRecord | null = null;
  const offers = state.offers.map((o) => {
    if (o.jdId === jdId && o.studentId === studentId && o.status === 'pending') {
      updated = {
        ...o,
        status,
        respondedAt: new Date().toISOString(),
        ...(reason ? { responseReason: reason } : {}),
      };
      return updated;
    }
    return o;
  });
  if (updated) persist({ ...state, offers });
  return updated;
}

/** The locked float order for a JD, or null if no sequence has been locked. */
export function getSequence(jdId: string): FloatSequenceRecord | null {
  return loadState().sequences[jdId] ?? null;
}

/**
 * One-shot lock of a JD's float order. Refuses a second lock: once a sequence
 * exists it is canonical (the order an out-of-sequence guard reads). Returns the
 * existing record on a refused re-lock so callers can surface "already locked".
 */
export function lockSequence(
  jdId: string,
  order: readonly string[],
): { ok: true; record: FloatSequenceRecord } | { ok: false; reason: string; record: FloatSequenceRecord } {
  const state = loadState();
  const existing = state.sequences[jdId];
  if (existing) {
    return { ok: false, reason: 'Float sequence is already locked for this JD.', record: existing };
  }
  const record: FloatSequenceRecord = {
    jdId,
    order: [...order],
    lockedAt: new Date().toISOString(),
  };
  persist({ ...state, sequences: { ...state.sequences, [jdId]: record } });
  return { ok: true, record };
}

/**
 * Lazily expire a single pending offer: stamps `respondedAt` + `reason` and
 * flips status to 'expired'. No-op (returns null) if the offer is not pending.
 * `at` is injectable so the deadline-sweep and simulate paths share one writer.
 */
export function expireOffer(
  jdId: string,
  studentId: string,
  reason: string,
  at: string = new Date().toISOString(),
): OfferRecord | null {
  const state = loadState();
  let updated: OfferRecord | null = null;
  const offers = state.offers.map((o) => {
    if (o.jdId === jdId && o.studentId === studentId && o.status === 'pending') {
      const next: OfferRecord = { ...o, status: 'expired', respondedAt: at, responseReason: reason };
      updated = next;
      return next;
    }
    return o;
  });
  if (updated) persist({ ...state, offers });
  return updated;
}
