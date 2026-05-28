import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ApplicationTokenRecord, OutboxMessage, RecruiterStatus } from './types';
import { formatTokenId, windowForDate, yearForDate } from './tokens';

/**
 * Mock store for Milestone 2. JSON-backed so demo tokens survive Next.js
 * dev-server restarts. The DB-backed implementation that lands in a future
 * milestone replaces this file behind the same module API in `index.ts` —
 * callers never see the difference.
 *
 * NOT thread-safe; fine for dev with the single-process Next.js server.
 */

interface StoreState {
  readonly tokens: Record<string, ApplicationTokenRecord>;
  readonly counters: Record<string, number>; // key = `${year}-${window}`
  readonly outbox: readonly OutboxMessage[];
}

function dataFilePath(): string {
  const root = process.cwd();
  return resolve(root, '.dev-data', 'recruiter-onboarding.json');
}

function loadState(): StoreState {
  const file = dataFilePath();
  if (!existsSync(file)) {
    return seedInitialState();
  }
  const raw = readFileSync(file, 'utf8');
  try {
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      tokens: parsed.tokens ?? {},
      counters: parsed.counters ?? {},
      outbox: parsed.outbox ?? [],
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

function seedInitialState(): StoreState {
  // Three demo tokens at different status levels so the tracker has something
  // to show out-of-the-box during the prototype demo.
  const now = new Date();
  const isoYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const isoTwoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const isoOneHour = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  const demoTokens: ApplicationTokenRecord[] = [
    {
      tokenId: 'NID-2026-A-0001',
      cycleId: 'cycle_spring_2026',
      companyName: 'Acme Design Studio',
      sector: 'Design Consultancy',
      gst: '24AAACA1234B1Z5',
      registrationNumber: 'U74999GJ2012PTC012345',
      corporateEmail: 'hire@acmedesign.example',
      websiteUrl: 'https://acmedesign.example',
      contactName: 'Mira Patel',
      contactPhone: '+91 90000 12345',
      status: 'credentials-issued',
      statusHistory: [
        { status: 'application-received', at: isoTwoDaysAgo, note: 'Form submitted.' },
        { status: 'verification-pending', at: isoTwoDaysAgo, note: 'Initial vetting begun.' },
        { status: 'fee-due', at: isoYesterday, note: 'Vetting passed; participation fee invoice issued.' },
        { status: 'payment-received', at: isoYesterday, note: 'Payment confirmed via gateway.' },
        { status: 'approved', at: isoOneHour },
        { status: 'credentials-issued', at: isoOneHour, note: 'Credentials emailed to hire@acmedesign.example.' },
      ],
      createdAt: isoTwoDaysAgo,
      feeAmountPaise: 1_500_000,
    },
    {
      tokenId: 'NID-2026-A-0017',
      cycleId: 'cycle_spring_2026',
      companyName: 'Northbeam Hardware',
      sector: 'Consumer Electronics',
      gst: '29AAFCN5678P1ZX',
      registrationNumber: 'U30007KA2018PTC067890',
      corporateEmail: 'careers@northbeam.example',
      contactName: 'Ravi Kumar',
      contactPhone: '+91 88888 54321',
      status: 'fee-due',
      statusHistory: [
        { status: 'application-received', at: isoYesterday, note: 'Form submitted.' },
        { status: 'verification-pending', at: isoYesterday, note: 'Vetting in queue.' },
        { status: 'fee-due', at: isoOneHour, note: 'Vetting passed; please complete payment.' },
      ],
      createdAt: isoYesterday,
      feeAmountPaise: 1_500_000,
    },
    {
      tokenId: 'NID-2026-A-0042',
      cycleId: 'cycle_spring_2026',
      companyName: 'Loom & Weft',
      sector: 'Textile / Apparel',
      gst: '07AAGCL2244K1Z6',
      registrationNumber: 'U17299DL2020PTC543210',
      corporateEmail: 'industry@loomandweft.example',
      contactName: 'Aanya Roy',
      contactPhone: '+91 77777 67890',
      status: 'application-received',
      statusHistory: [
        { status: 'application-received', at: isoOneHour, note: 'Form submitted; pending verification.' },
      ],
      createdAt: isoOneHour,
    },
  ];

  const tokens: Record<string, ApplicationTokenRecord> = {};
  for (const t of demoTokens) tokens[t.tokenId] = t;

  const state: StoreState = {
    tokens,
    counters: { '2026-A': 42 },
    outbox: [],
  };
  persist(state);
  return state;
}

export interface SubmitInput {
  readonly cycleId: string;
  readonly companyName: string;
  readonly sector: string;
  readonly gst: string;
  readonly registrationNumber: string;
  readonly corporateEmail: string;
  readonly websiteUrl?: string | undefined; // exactOptionalPropertyTypes: allow explicit undefined
  readonly contactName: string;
  readonly contactPhone: string;
}

export interface SubmitResult {
  readonly tokenId: string;
  readonly trackerPath: string;
}

export function submitApplication(input: SubmitInput): SubmitResult {
  const state = loadState();
  const now = new Date();
  const year = yearForDate(now);
  const window = windowForDate(now);
  const counterKey = `${year}-${window}`;
  const currentCounter = state.counters[counterKey] ?? 0;
  const nextCounter = currentCounter + 1;
  const tokenId = formatTokenId(year, window, nextCounter);
  const createdAt = now.toISOString();

  const record: ApplicationTokenRecord = {
    tokenId,
    cycleId: input.cycleId,
    companyName: input.companyName,
    sector: input.sector,
    gst: input.gst,
    registrationNumber: input.registrationNumber,
    corporateEmail: input.corporateEmail,
    ...(input.websiteUrl ? { websiteUrl: input.websiteUrl } : {}),
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    status: 'application-received',
    statusHistory: [
      {
        status: 'application-received',
        at: createdAt,
        note: 'Application received. We will verify your details and reach out.',
      },
    ],
    createdAt,
  };

  const outboxEntry: OutboxMessage = {
    id: `outbox_${tokenId}_${Date.now()}`,
    tokenId,
    channel: 'email',
    to: input.corporateEmail,
    templateId: 'application.received',
    renderedSubject: `NID Industry Interface — application received (${tokenId})`,
    renderedBody:
      `Dear ${input.contactName},\n\n` +
      `Thank you for applying to recruit from NID. Your application has been received under token ${tokenId}.\n\n` +
      `Track your application at: /track/${tokenId}\n\n` +
      `We will reach out after vetting your company details (typically within 3 working days).\n\n` +
      `— NID Industry Interface`,
    queuedAt: createdAt,
  };

  persist({
    tokens: { ...state.tokens, [tokenId]: record },
    counters: { ...state.counters, [counterKey]: nextCounter },
    outbox: [...state.outbox, outboxEntry],
  });

  return { tokenId, trackerPath: `/track/${tokenId}` };
}

export function getTokenStatus(tokenId: string): ApplicationTokenRecord | null {
  const state = loadState();
  return state.tokens[tokenId] ?? null;
}

export function listAllTokens(): readonly ApplicationTokenRecord[] {
  const state = loadState();
  const all = Object.values(state.tokens);
  // Newest first by createdAt — admin queue most-recent-first ordering.
  return all.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listOutboxAll(): readonly OutboxMessage[] {
  const state = loadState();
  return state.outbox.slice().sort((a, b) => b.queuedAt.localeCompare(a.queuedAt));
}

export function listOutboxForToken(tokenId: string): readonly OutboxMessage[] {
  const state = loadState();
  return state.outbox.filter((m) => m.tokenId === tokenId);
}

/**
 * Admin-only forward transition. Used in Milestone 3 by the admin queue.
 * Exposed here so the contract is defined; the admin UI will gate access.
 */
export function advanceTokenStatus(input: {
  tokenId: string;
  toStatus: RecruiterStatus;
  note?: string | undefined;
  feeAmountPaise?: number | undefined;
}): ApplicationTokenRecord | null {
  const state = loadState();
  const current = state.tokens[input.tokenId];
  if (!current) return null;

  const newHistory: typeof current.statusHistory = [
    ...current.statusHistory,
    {
      status: input.toStatus,
      at: new Date().toISOString(),
      ...(input.note ? { note: input.note } : {}),
    },
  ];

  const updated: ApplicationTokenRecord = {
    ...current,
    status: input.toStatus,
    statusHistory: newHistory,
    ...(input.feeAmountPaise !== undefined ? { feeAmountPaise: input.feeAmountPaise } : {}),
  };

  persist({
    ...state,
    tokens: { ...state.tokens, [input.tokenId]: updated },
  });

  return updated;
}
