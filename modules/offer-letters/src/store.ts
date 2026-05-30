import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { syncKv } from '@nid/db';
import { dirname, resolve } from 'node:path';
import type { OfferLetter } from './types';

interface StoreState {
  /** Letters keyed by their own id (`oletter_NNNNN`). */
  readonly letters: Record<string, OfferLetter>;
  /** Certificate hash → letter id, for O(1) public `/verify/<hash>` lookups. */
  readonly byHash: Record<string, string>;
  readonly counter: number;
}

function dataFilePath(): string {
  return resolve(
    process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(process.cwd(), '.dev-data'),
    'offer-letters.json',
  );
}

/**
 * No demo seed: an offer letter requires a real uploaded PDF, which we cannot
 * fabricate meaningfully at module-init time (a fake base64 blob would mint a
 * certificate over garbage). The store starts empty; the first recruiter upload
 * via `pushOfferLetter` populates it. Mirrors offer-cascade's structure minus
 * the seed.
 */
function emptyState(): StoreState {
  return { letters: {}, byHash: {}, counter: 0 };
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return emptyState();
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return {
      letters: p.letters ?? {},
      byHash: p.byHash ?? {},
      counter: p.counter ?? 0,
    };
  } catch {
    return emptyState();
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
  // Durable write-through (no-op without DATABASE_URL): mirror the full state
  // blob to Postgres so uploaded letters survive serverless cold starts.
  syncKv('offer-letters', state);
}

/** The deterministic id for a (jdId, studentId) letter — one letter per pair. */
function letterKey(jdId: string, studentId: string): string {
  return `oletter_${jdId}_${studentId}`;
}

/** Find the existing letter for a (jdId, studentId), if any. */
export function findLetter(jdId: string, studentId: string): OfferLetter | null {
  const state = loadState();
  return state.letters[letterKey(jdId, studentId)] ?? null;
}

/**
 * Insert a brand-new letter or version-bump an existing one for the same
 * (jdId, studentId). On re-push the old hash mapping is removed from `byHash`
 * and the new one added, so `/verify/<oldHash>` stops resolving once superseded.
 * The caller (actions.ts) builds the full `OfferLetter` (incl. certificate);
 * this function owns persistence + the `byHash` index + version continuity.
 */
export function upsertLetter(
  draft: Omit<OfferLetter, 'id' | 'version' | 'updatedAt'>,
): OfferLetter {
  const state = loadState();
  const id = letterKey(draft.jdId, draft.studentId);
  const existing = state.letters[id];

  const nextVersion = existing ? existing.version + 1 : 1;
  const counter = existing ? state.counter : state.counter + 1;

  const full: OfferLetter = {
    ...draft,
    id,
    version: nextVersion,
    ...(existing ? { updatedAt: new Date().toISOString() } : {}),
  };

  // Rebuild byHash: drop the prior hash for this letter (if changed), add current.
  const byHash: Record<string, string> = { ...state.byHash };
  if (existing && existing.certificate.hash !== full.certificate.hash) {
    delete byHash[existing.certificate.hash];
  }
  byHash[full.certificate.hash] = id;

  persist({
    letters: { ...state.letters, [id]: full },
    byHash,
    counter,
  });
  return full;
}

/** All letters for a JD, sorted by wave then upload time. */
export function lettersForJd(jdId: string): readonly OfferLetter[] {
  return Object.values(loadState().letters)
    .filter((l) => l.jdId === jdId)
    .sort((a, b) => a.wave - b.wave || a.uploadedAt.localeCompare(b.uploadedAt));
}

/** Resolve a certificate hash to its letter via the `byHash` index. */
export function letterByHash(hash: string): OfferLetter | null {
  const state = loadState();
  const id = state.byHash[hash];
  if (!id) return null;
  return state.letters[id] ?? null;
}
