import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type {
  BlacklistEntry,
  HealthEventRecord,
  PaymentCase,
  RedressalCase,
} from './types';

/**
 * JSON-backed accountability store. Holds the raw health *events*, redressal
 * cases, blacklist entries, and payment cases. The score itself is NOT stored —
 * it is recomputed from events by @nid/core every read (the score is a pure
 * function of history; Phase 5.11 "not predictive, deterministic sum").
 */

interface StoreState {
  readonly events: readonly HealthEventRecord[];
  readonly redressal: readonly RedressalCase[];
  readonly blacklist: readonly BlacklistEntry[];
  readonly payments: readonly PaymentCase[];
}

function dataFilePath(): string {
  return resolve(process.cwd(), '.dev-data', 'admin-accountability.json');
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function seedInitialState(): StoreState {
  const ev = (
    recruiterId: string,
    companyName: string,
    event: HealthEventRecord['event'],
    d: number,
  ): HealthEventRecord => ({ recruiterId, companyName, event, at: daysAgo(d) });

  const ACME = 'NID-2026-A-0001';
  const BAUHAUS = 'NID-2026-G-0007';
  const PIXEL = 'NID-2026-B-0012';
  const GHOST = 'NID-2025-A-0003';

  const events: HealthEventRecord[] = [
    // Acme Design Studio → +10 → 80 → excellent
    ev(ACME, 'Acme Design Studio', 'cycle-completed-successfully', 120),
    ev(ACME, 'Acme Design Studio', 'cycle-completed-successfully', 30),
    ev(ACME, 'Acme Design Studio', 'returning-recruiter', 120),
    ev(ACME, 'Acme Design Studio', 'returning-recruiter', 30),
    ev(ACME, 'Acme Design Studio', 'returning-recruiter', 5),
    ev(ACME, 'Acme Design Studio', 'above-recommended-stipend', 28),
    ev(ACME, 'Acme Design Studio', 'peer-review-positive', 90),
    ev(ACME, 'Acme Design Studio', 'peer-review-positive', 20),

    // Bauhaus Interiors → 0 → 70 → good
    ev(BAUHAUS, 'Bauhaus Interiors', 'cycle-completed-successfully', 60),
    ev(BAUHAUS, 'Bauhaus Interiors', 'interview-slot-late-cancel', 25),

    // Pixel Forge → -28 → 42 → watch
    ev(PIXEL, 'Pixel Forge', 'ppt-no-show', 40),
    ev(PIXEL, 'Pixel Forge', 'post-offer-ghost', 35),
    ev(PIXEL, 'Pixel Forge', 'redressal-upheld-score-impact', 30),
    ev(PIXEL, 'Pixel Forge', 'redressal-warning', 28),
    ev(PIXEL, 'Pixel Forge', 'analyzer-flag-posted-anyway', 20),
    ev(PIXEL, 'Pixel Forge', 'interview-slot-late-cancel', 15),
    ev(PIXEL, 'Pixel Forge', 'public-news-flag', 10),

    // GhostCorp Studios → ≤ -60 → ~6 → blacklisted (also has an explicit entry)
    ev(GHOST, 'GhostCorp Studios', 'redressal-upheld-api-revoke', 200),
    ev(GHOST, 'GhostCorp Studios', 'redressal-upheld-api-revoke', 180),
    ev(GHOST, 'GhostCorp Studios', 'post-offer-ghost', 190),
    ev(GHOST, 'GhostCorp Studios', 'post-offer-ghost', 170),
    ev(GHOST, 'GhostCorp Studios', 'redressal-upheld-score-impact', 160),
    ev(GHOST, 'GhostCorp Studios', 'public-news-flag', 150),
    ev(GHOST, 'GhostCorp Studios', 'ppt-no-show', 140),
  ];

  const redressal: RedressalCase[] = [
    {
      id: 'red_00001',
      recruiterId: PIXEL,
      companyName: 'Pixel Forge',
      studentLabel: 'M.Des UX · batch 2025',
      category: 'stipend-not-paid',
      description:
        'Internship stipend for the second month was not paid; company stopped responding to emails.',
      isInternship: true,
      status: 'open',
      filedAt: daysAgo(6),
    },
    {
      id: 'red_00002',
      recruiterId: GHOST,
      companyName: 'GhostCorp Studios',
      studentLabel: 'B.Des Comm · batch 2024',
      category: 'contract-dishonoured',
      description: 'Offer was rescinded after acceptance, two weeks before the joining date.',
      isInternship: false,
      status: 'upheld-revoke',
      filedAt: daysAgo(185),
      decidedAt: daysAgo(180),
      decisionNote: 'Upheld. API access revoked; company moved toward blacklist.',
    },
  ];

  const blacklist: BlacklistEntry[] = [
    {
      recruiterId: GHOST,
      companyName: 'GhostCorp Studios',
      reason: 'Post-offer ghosting + rescinded offer after acceptance (upheld redressal).',
      cooldownMonths: 12,
      addedAt: daysAgo(175),
      lifted: false,
    },
  ];

  const payments: PaymentCase[] = [
    {
      id: 'pay_00001',
      recruiterId: 'NID-2026-A-0001',
      companyName: 'Acme Design Studio',
      kind: 'dispute',
      category: 'GST mismatch on participation-fee invoice',
      amountPaise: 1_500_000,
      status: 'open',
      filedAt: daysAgo(3),
    },
    {
      id: 'pay_00002',
      recruiterId: BAUHAUS,
      companyName: 'Bauhaus Interiors',
      kind: 'refund',
      category: 'Paid participation fee twice',
      amountPaise: 1_500_000,
      status: 'open',
      filedAt: daysAgo(2),
    },
  ];

  return { events, redressal, blacklist, payments };
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) return seedInitialState();
  try {
    const p = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoreState>;
    return {
      events: p.events ?? [],
      redressal: p.redressal ?? [],
      blacklist: p.blacklist ?? [],
      payments: p.payments ?? [],
    };
  } catch {
    return seedInitialState();
  }
}

function persist(state: StoreState): void {
  const file = dataFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

// ── reads ────────────────────────────────────────────────────────────────────

export function allEvents(): readonly HealthEventRecord[] {
  return loadState().events;
}
export function allRedressal(): readonly RedressalCase[] {
  return loadState().redressal;
}
export function allBlacklist(): readonly BlacklistEntry[] {
  return loadState().blacklist;
}
export function allPayments(): readonly PaymentCase[] {
  return loadState().payments;
}

// ── writes ─────────────────────────────────────────────────────────────────

export function appendEvent(record: HealthEventRecord): void {
  const s = loadState();
  persist({ ...s, events: [...s.events, record] });
}

export function updateRedressal(caseId: string, patch: Partial<RedressalCase>): RedressalCase | null {
  const s = loadState();
  let updated: RedressalCase | null = null;
  const redressal = s.redressal.map((c) => {
    if (c.id === caseId) {
      updated = { ...c, ...patch, id: c.id };
      return updated;
    }
    return c;
  });
  if (updated) persist({ ...s, redressal });
  return updated;
}

export function upsertBlacklist(entry: BlacklistEntry): void {
  const s = loadState();
  const without = s.blacklist.filter((b) => b.recruiterId !== entry.recruiterId);
  persist({ ...s, blacklist: [...without, entry] });
}

export function updatePayment(caseId: string, patch: Partial<PaymentCase>): PaymentCase | null {
  const s = loadState();
  let updated: PaymentCase | null = null;
  const payments = s.payments.map((c) => {
    if (c.id === caseId) {
      updated = { ...c, ...patch, id: c.id };
      return updated;
    }
    return c;
  });
  if (updated) persist({ ...s, payments });
  return updated;
}
