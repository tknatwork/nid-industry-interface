import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { syncKv } from '@nid/db';
import { dirname, resolve } from 'node:path';
import type {
  AccountActivationRecord,
  ApplicationTicketRecord,
  OutboxMessage,
  PaymentReceipt,
  RecruiterStatus,
} from './types';
import { formatTicketId, windowForDate, yearForDate } from './tokens';

/**
 * Mock store for Milestone 2. JSON-backed so demo tickets survive Next.js
 * dev-server restarts. The DB-backed implementation that lands in a future
 * milestone replaces this file behind the same module API in `index.ts` —
 * callers never see the difference.
 *
 * NOT thread-safe; fine for dev with the single-process Next.js server.
 */

interface StoreState {
  readonly tickets: Record<string, ApplicationTicketRecord>;
  readonly counters: Record<string, number>; // key = `${year}-${window}`
  readonly outbox: readonly OutboxMessage[];
  // Per-recruiter account-activation / cycle-lock state, keyed by recruiterId
  // (=== ticketId in this demo). Plan Round 3 §C — accounts lock between cycles
  // and reactivate by re-paying the participation fee.
  readonly accounts: Record<string, AccountActivationRecord>;
}

function dataFilePath(): string {
  const root = process.cwd();
  return resolve(process.env['VERCEL'] ? '/tmp/nid-dev-data' : resolve(root, '.dev-data'), 'recruiter-onboarding.json');
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
      tickets: parsed.tickets ?? {},
      counters: parsed.counters ?? {},
      outbox: parsed.outbox ?? [],
      accounts: parsed.accounts ?? {},
    };
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
  syncKv('recruiter-onboarding', state);
}

function seedInitialState(): StoreState {
  // Three demo tickets at different status levels so the tracker has something
  // to show out-of-the-box during the prototype demo.
  const now = new Date();
  const isoYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const isoTwoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const isoOneHour = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  const demoTickets: ApplicationTicketRecord[] = [
    {
      ticketId: 'NID-2026-A-0001',
      cycleId: 'cycle_spring_2026',
      companyName: 'Acme Design Studio',
      // Branch of the 'acme' parent company (plan Round 3 §D). This is the
      // primary (Bengaluru) branch; its sibling NID-2026-A-0002 (Ahmedabad)
      // is a SEPARATE recruiter account with its OWN gst/registration/contacts.
      parentCompanyId: 'acme',
      branchLabel: 'Bengaluru',
      sector: 'Design Consultancy',
      gst: '24AAACA1234B1Z5',
      registrationNumber: 'U74999GJ2012PTC012345',
      corporateEmail: 'hire@acmedesign.example',
      websiteUrl: 'https://acmedesign.example',
      contactName: 'Mira Patel',
      contactPhone: '+91 90000 12345',
      phoneVerified: true,
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
      receiptId: 'NID-RCPT-2026-A-0001',
      receipt: {
        receiptId: 'NID-RCPT-2026-A-0001',
        amountPaise: 1_500_000,
        paidAt: isoYesterday,
        method: 'Demo gateway (UPI)',
        gatewayRef: 'DEMOPAY-0001',
      },
    },
    {
      // Second branch of the SAME parent company 'acme' (plan Round 3 §D): a
      // SEPARATE recruiter account with its OWN gst, registration number,
      // corporate email, contact, and credentials. It intentionally has NO JDs —
      // a freshly-credentialed branch — which proves per-branch isolation
      // (the Bengaluru branch's JDs never leak into this Ahmedabad dashboard).
      ticketId: 'NID-2026-A-0002',
      cycleId: 'cycle_spring_2026',
      companyName: 'Acme Design Studio',
      parentCompanyId: 'acme',
      branchLabel: 'Ahmedabad',
      sector: 'Design Consultancy',
      gst: '24AAACA1234B2Z4',
      registrationNumber: 'U74999GJ2014PTC024680',
      corporateEmail: 'hire-ahm@acmedesign.example',
      websiteUrl: 'https://acmedesign.example',
      contactName: 'Deven Shah',
      contactPhone: '+91 90000 67890',
      phoneVerified: true,
      status: 'credentials-issued',
      statusHistory: [
        { status: 'application-received', at: isoTwoDaysAgo, note: 'Form submitted for the Ahmedabad branch.' },
        { status: 'verification-pending', at: isoTwoDaysAgo, note: 'Initial vetting begun.' },
        { status: 'fee-due', at: isoYesterday, note: 'Vetting passed; participation fee invoice issued.' },
        { status: 'payment-received', at: isoYesterday, note: 'Payment confirmed via gateway.' },
        { status: 'approved', at: isoOneHour },
        { status: 'credentials-issued', at: isoOneHour, note: 'Credentials emailed to hire-ahm@acmedesign.example.' },
      ],
      createdAt: isoTwoDaysAgo,
      feeAmountPaise: 1_500_000,
      receiptId: 'NID-RCPT-2026-A-0002',
      receipt: {
        receiptId: 'NID-RCPT-2026-A-0002',
        amountPaise: 1_500_000,
        paidAt: isoYesterday,
        method: 'Demo gateway (UPI)',
        gatewayRef: 'DEMOPAY-0002',
      },
    },
    {
      ticketId: 'NID-2026-A-0017',
      cycleId: 'cycle_spring_2026',
      companyName: 'Northbeam Hardware',
      sector: 'Consumer Electronics',
      gst: '29AAFCN5678P1ZX',
      registrationNumber: 'U30007KA2018PTC067890',
      corporateEmail: 'careers@northbeam.example',
      contactName: 'Ravi Kumar',
      contactPhone: '+91 88888 54321',
      phoneVerified: true,
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
      ticketId: 'NID-2026-A-0042',
      cycleId: 'cycle_spring_2026',
      companyName: 'Loom & Weft',
      sector: 'Textile / Apparel',
      gst: '07AAGCL2244K1Z6',
      registrationNumber: 'U17299DL2020PTC543210',
      corporateEmail: 'industry@loomandweft.example',
      contactName: 'Aanya Roy',
      contactPhone: '+91 77777 67890',
      phoneVerified: false,
      status: 'application-received',
      statusHistory: [
        { status: 'application-received', at: isoOneHour, note: 'Form submitted; pending verification.' },
      ],
      createdAt: isoOneHour,
    },
  ];

  const tickets: Record<string, ApplicationTicketRecord> = {};
  for (const t of demoTickets) tickets[t.ticketId] = t;

  // Seed the demo recruiter Acme as active for the spring 2026 cycle and
  // unlocked, so the cycle-lock / reactivation surfaces have a live account
  // to act on out-of-the-box (plan Round 3 §C).
  const accounts: Record<string, AccountActivationRecord> = {
    'NID-2026-A-0001': {
      recruiterId: 'NID-2026-A-0001',
      activeCycleId: 'cycle_spring_2026',
      locked: false,
    },
    // The Ahmedabad branch is its OWN account with its OWN activation state —
    // it can lock/reactivate independently of the Bengaluru branch (§D).
    'NID-2026-A-0002': {
      recruiterId: 'NID-2026-A-0002',
      activeCycleId: 'cycle_spring_2026',
      locked: false,
    },
  };

  const state: StoreState = {
    tickets,
    counters: { '2026-A': 42 },
    outbox: [],
    accounts,
  };
  persist(state);
  return state;
}

export interface SubmitInput {
  readonly cycleId: string;
  readonly companyName: string;
  /**
   * Parent-company grouping id (plan Round 3 §D), present only when this
   * application is one branch of an existing parent. Persisted onto the record
   * so multi-branch surfaces can group it; absent for standalone recruiters.
   */
  readonly parentCompanyId?: string | undefined; // exactOptionalPropertyTypes: allow explicit undefined
  /** Human label distinguishing this branch within its parent (e.g. 'Bengaluru'). */
  readonly branchLabel?: string | undefined;
  readonly sector: string;
  readonly gst: string;
  readonly registrationNumber: string;
  readonly corporateEmail: string;
  readonly websiteUrl?: string | undefined; // exactOptionalPropertyTypes: allow explicit undefined
  readonly contactName: string;
  readonly contactPhone: string;
  readonly phoneVerified?: boolean | undefined;
}

export interface SubmitResult {
  readonly ticketId: string;
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
  const ticketId = formatTicketId(year, window, nextCounter);
  const createdAt = now.toISOString();

  const record: ApplicationTicketRecord = {
    ticketId,
    cycleId: input.cycleId,
    companyName: input.companyName,
    // Multi-branch grouping (plan Round 3 §D) — only carried when supplied, via
    // conditional spreads so the optional record fields never get an explicit
    // `undefined` under exactOptionalPropertyTypes (same pattern as websiteUrl).
    ...(input.parentCompanyId ? { parentCompanyId: input.parentCompanyId } : {}),
    ...(input.branchLabel ? { branchLabel: input.branchLabel } : {}),
    sector: input.sector,
    gst: input.gst,
    registrationNumber: input.registrationNumber,
    corporateEmail: input.corporateEmail,
    ...(input.websiteUrl ? { websiteUrl: input.websiteUrl } : {}),
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    phoneVerified: input.phoneVerified ?? false,
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

  // The ticket is "sent" to both the corporate email and the primary contact
  // number (SMS) — plan §G. Both are mocked previews in dev; nothing is sent.
  const emailEntry: OutboxMessage = {
    id: `outbox_${ticketId}_email_${Date.now()}`,
    ticketId,
    channel: 'email',
    to: input.corporateEmail,
    templateId: 'application.received',
    renderedSubject: `NID Industry Interface — application received (${ticketId})`,
    renderedBody:
      `Dear ${input.contactName},\n\n` +
      `Thank you for applying to recruit from NID. Your application has been received under ticket ${ticketId}.\n\n` +
      `Track your application at: /track/${ticketId}\n\n` +
      `We will reach out after vetting your company details (typically within 3 working days).\n\n` +
      `— NID Industry Interface`,
    queuedAt: createdAt,
  };

  const smsEntry: OutboxMessage = {
    id: `outbox_${ticketId}_sms_${Date.now()}`,
    ticketId,
    channel: 'sms',
    to: input.contactPhone,
    templateId: 'application.received.sms',
    renderedBody:
      `NID Industry Interface: application received. Your ticket is ${ticketId}. ` +
      `Track at /track/${ticketId}`,
    queuedAt: createdAt,
  };

  persist({
    ...state,
    tickets: { ...state.tickets, [ticketId]: record },
    counters: { ...state.counters, [counterKey]: nextCounter },
    outbox: [...state.outbox, emailEntry, smsEntry],
  });

  return { ticketId, trackerPath: `/track/${ticketId}` };
}

export function getTicketStatus(ticketId: string): ApplicationTicketRecord | null {
  const state = loadState();
  return state.tickets[ticketId] ?? null;
}

export function listAllTickets(): readonly ApplicationTicketRecord[] {
  const state = loadState();
  const all = Object.values(state.tickets);
  // Newest first by createdAt — admin queue most-recent-first ordering.
  return all.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listOutboxAll(): readonly OutboxMessage[] {
  const state = loadState();
  return state.outbox.slice().sort((a, b) => b.queuedAt.localeCompare(a.queuedAt));
}

export function listOutboxForTicket(ticketId: string): readonly OutboxMessage[] {
  const state = loadState();
  return state.outbox.filter((m) => m.ticketId === ticketId);
}

/**
 * Admin-only forward transition. Used in Milestone 3 by the admin queue.
 * Exposed here so the contract is defined; the admin UI will gate access.
 */
export function advanceTicketStatus(input: {
  ticketId: string;
  toStatus: RecruiterStatus;
  note?: string | undefined;
  feeAmountPaise?: number | undefined;
}): ApplicationTicketRecord | null {
  const state = loadState();
  const current = state.tickets[input.ticketId];
  if (!current) return null;

  const newHistory: typeof current.statusHistory = [
    ...current.statusHistory,
    {
      status: input.toStatus,
      at: new Date().toISOString(),
      ...(input.note ? { note: input.note } : {}),
    },
  ];

  const updated: ApplicationTicketRecord = {
    ...current,
    status: input.toStatus,
    statusHistory: newHistory,
    ...(input.feeAmountPaise !== undefined ? { feeAmountPaise: input.feeAmountPaise } : {}),
  };

  persist({
    ...state,
    tickets: { ...state.tickets, [input.ticketId]: updated },
  });

  return updated;
}

/**
 * Recruiter self-service edit of the editable contact fields (plan §L). Only the
 * corporate email, primary contact phone, and the mock phone-verified flag may
 * change here — identity/registration fields (GST, company name, registration
 * number) are immutable post-application. Keeps the current status and appends a
 * history entry so the change is auditable in the tracker.
 *
 * `recruiterId === ticketId` in this demo (the recruiter is identified by the
 * application ticket until real auth lands). Returns null if the ticket is
 * missing.
 */
export function updateContactDetails(input: {
  ticketId: string;
  corporateEmail?: string | undefined;
  contactPhone?: string | undefined;
  phoneVerified?: boolean | undefined;
}): ApplicationTicketRecord | null {
  const state = loadState();
  const current = state.tickets[input.ticketId];
  if (!current) return null;

  const updated: ApplicationTicketRecord = {
    ...current,
    ...(input.corporateEmail !== undefined ? { corporateEmail: input.corporateEmail } : {}),
    ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
    ...(input.phoneVerified !== undefined ? { phoneVerified: input.phoneVerified } : {}),
    statusHistory: [
      ...current.statusHistory,
      {
        status: current.status,
        at: new Date().toISOString(),
        note: 'Contact details updated.',
      },
    ],
  };

  persist({
    ...state,
    tickets: { ...state.tickets, [current.ticketId]: updated },
  });

  return updated;
}

export interface PayResult {
  readonly record: ApplicationTicketRecord;
  readonly receipt: PaymentReceipt;
}

/**
 * Record a (mock) participation-fee payment for a ticket in `fee-due`,
 * advance it to `payment-received`, generate a receipt mapped to the ticket,
 * and queue a receipt email to the corporate address. Plan §G — demo only,
 * no real gateway / PFMS settlement.
 *
 * Returns null if the ticket is missing or is not awaiting payment.
 */
export function payTicketFee(input: {
  ticketId: string;
  method?: string | undefined;
}): PayResult | null {
  const state = loadState();
  const current = state.tickets[input.ticketId];
  if (!current) return null;
  if (current.status !== 'fee-due') return null;

  const now = new Date();
  const paidAt = now.toISOString();
  // Derive the receipt id from the ticket's serial (e.g. NID-2026-A-0017 →
  // NID-RCPT-2026-A-0017); fall back to the full id if the shape ever differs.
  const serial = current.ticketId.match(/^NID-(\d{4}-[AB]-\d{4})$/)?.[1] ?? current.ticketId;
  const receiptId = `NID-RCPT-${serial}`;
  const amountPaise = current.feeAmountPaise ?? 1_500_000;
  const method = input.method ?? 'Demo gateway (UPI)';
  const gatewayRef = `DEMOPAY-${now.getTime().toString(36).toUpperCase()}`;

  const receipt: PaymentReceipt = {
    receiptId,
    amountPaise,
    paidAt,
    method,
    gatewayRef,
  };

  const updated: ApplicationTicketRecord = {
    ...current,
    status: 'payment-received',
    statusHistory: [
      ...current.statusHistory,
      {
        status: 'payment-received',
        at: paidAt,
        note: `Payment of ₹${(amountPaise / 100).toLocaleString('en-IN')} received (${method}). Receipt ${receiptId}.`,
      },
    ],
    feeAmountPaise: amountPaise,
    receiptId,
    receipt,
  };

  const receiptEmail: OutboxMessage = {
    id: `outbox_${current.ticketId}_receipt_${now.getTime()}`,
    ticketId: current.ticketId,
    channel: 'email',
    to: current.corporateEmail,
    templateId: 'payment.receipt',
    renderedSubject: `NID Industry Interface — fee receipt ${receiptId}`,
    renderedBody:
      `Dear ${current.contactName},\n\n` +
      `We have received your participation fee of ₹${(amountPaise / 100).toLocaleString('en-IN')} for ticket ${current.ticketId}.\n\n` +
      `Receipt: ${receiptId}\nGateway ref: ${gatewayRef}\n\n` +
      `A GST-compliant PDF/A receipt is available under your tracker and (after credentials) at /recruiter/receipts.\n\n` +
      `Your application now moves to final approval.\n\n` +
      `— NID Industry Interface`,
    queuedAt: paidAt,
  };

  // The receipt is sent to BOTH the corporate email and the primary contact
  // number (§G) — mirroring the application-received step, which queues both an
  // email and an SMS. The Receipt UI tells the recruiter it went out by email +
  // SMS, so the comms log must reflect both. Mock preview; nothing is sent.
  const receiptSms: OutboxMessage = {
    id: `outbox_${current.ticketId}_receipt_sms_${now.getTime()}`,
    ticketId: current.ticketId,
    channel: 'sms',
    to: current.contactPhone,
    templateId: 'payment.receipt.sms',
    renderedBody:
      `NID Industry Interface: fee of ₹${(amountPaise / 100).toLocaleString('en-IN')} received for ticket ${current.ticketId}. ` +
      `Receipt ${receiptId}. Track at /track/${current.ticketId}`,
    queuedAt: paidAt,
  };

  persist({
    ...state,
    tickets: { ...state.tickets, [current.ticketId]: updated },
    outbox: [...state.outbox, receiptEmail, receiptSms],
  });

  return { record: updated, receipt };
}

// ── Offer-letter delivery notice (plan Round 4 §D — "Delivery") ─────────────
//
// When a recruiter sends a signed offer letter, the student is notified on both
// channels (email + SMS), mirroring payTicketFee's dual-channel Outbox pair.
// The Outbox write stays here in the owning module so the web action never
// reaches into another module's store. Mock preview; nothing is actually sent.

export interface QueueOfferLetterNoticeInput {
  /** Recruiter sending the letter — used as the Outbox `ticketId` (recruiterId === ticketId). */
  readonly recruiterId: string;
  /** Student's email — when present, queues the email channel notice. */
  readonly studentEmail?: string | undefined;
  /** Student's phone — when present, queues the SMS channel notice. */
  readonly studentPhone?: string | undefined;
  /** JD title shown in the notice copy. */
  readonly jdTitle: string;
  /** Public path where the student views the letter + certificate (e.g. /student/offers or /verify/<hash>). */
  readonly verifyPath: string;
}

/**
 * Queue the offer-letter-delivered notice as an email + SMS Outbox pair
 * (templateId `offer.letter.delivered`), mirroring payTicketFee's dual-channel
 * pattern. Each channel is only queued when its destination is supplied, via
 * conditional inclusion (exactOptionalPropertyTypes — never an explicit
 * `undefined` `to`). Persists and returns the queued messages.
 */
export function queueOfferLetterNotice(input: QueueOfferLetterNoticeInput): readonly OutboxMessage[] {
  const state = loadState();
  const now = new Date();
  const queuedAt = now.toISOString();
  const stamp = now.getTime();

  const queued: OutboxMessage[] = [];

  if (input.studentEmail) {
    queued.push({
      id: `outbox_${input.recruiterId}_offerletter_email_${stamp}`,
      ticketId: input.recruiterId,
      channel: 'email',
      to: input.studentEmail,
      templateId: 'offer.letter.delivered',
      renderedSubject: `Your NID offer letter — ${input.jdTitle}`,
      renderedBody:
        `Congratulations!\n\n` +
        `Your signed offer letter for "${input.jdTitle}" is now available. It carries an ` +
        `institute certificate of authenticity you can verify online.\n\n` +
        `View your letter at: ${input.verifyPath}\n\n` +
        `— NID Industry Interface`,
      queuedAt,
    });
  }

  if (input.studentPhone) {
    queued.push({
      id: `outbox_${input.recruiterId}_offerletter_sms_${stamp}`,
      ticketId: input.recruiterId,
      channel: 'sms',
      to: input.studentPhone,
      templateId: 'offer.letter.delivered',
      renderedBody:
        `NID Industry Interface: your signed offer letter for "${input.jdTitle}" is ready. ` +
        `View it at ${input.verifyPath}`,
      queuedAt,
    });
  }

  if (queued.length > 0) {
    persist({ ...state, outbox: [...state.outbox, ...queued] });
  }

  return queued;
}

// ── Account activation / cycle lock (plan Round 3 §C) ───────────────────────
//
// Recruiter accounts lock between placement cycles. Credentials never change —
// only the lock + active-cycle state does. An admin "wind down" at cycle close
// locks every account on that cycle; the recruiter reactivates by re-paying the
// participation fee for the next cycle (mock, mirroring payTicketFee).

/** Default participation-fee amount in paise, reused for reactivation (mock). */
const DEFAULT_PARTICIPATION_FEE_PAISE = 1_500_000;

/** The active state a recruiter falls back to when no account record exists. */
function defaultAccountState(): { activeCycleId: string; locked: boolean } {
  return { activeCycleId: 'cycle_spring_2026', locked: false };
}

/**
 * Read a recruiter's account-activation state. Falls back to the seeded active
 * state (active on the spring 2026 cycle, unlocked) when no record exists, so
 * callers always get a usable shape.
 */
export function getAccountState(
  recruiterId: string,
): { activeCycleId: string; locked: boolean; reactivatedAt?: string } {
  const state = loadState();
  const record = state.accounts[recruiterId];
  if (!record) return defaultAccountState();
  return {
    activeCycleId: record.activeCycleId,
    locked: record.locked,
    ...(record.reactivatedAt !== undefined ? { reactivatedAt: record.reactivatedAt } : {}),
  };
}

/** Whether a recruiter's account is currently locked (defaults to unlocked). */
export function isAccountLocked(recruiterId: string): boolean {
  return getAccountState(recruiterId).locked;
}

/**
 * Admin "wind down": lock every account whose active cycle is `cycleId`.
 * Returns how many accounts were newly locked (already-locked accounts on the
 * cycle are not re-counted). Credentials are untouched.
 */
export function windDownCycle(cycleId: string): number {
  const state = loadState();
  let lockedCount = 0;
  const nextAccounts: Record<string, AccountActivationRecord> = { ...state.accounts };
  for (const [id, record] of Object.entries(state.accounts)) {
    if (record.activeCycleId === cycleId && !record.locked) {
      nextAccounts[id] = { ...record, locked: true };
      lockedCount += 1;
    }
  }
  if (lockedCount > 0) {
    persist({ ...state, accounts: nextAccounts });
  }
  return lockedCount;
}

export interface ReactivateResult {
  readonly ok: boolean;
  readonly receipt?: PaymentReceipt;
  readonly reason?: string;
}

/**
 * Reactivate a recruiter for the next cycle by re-paying the participation fee
 * (mock — mirrors payTicketFee: mints a PaymentReceipt and queues an email + SMS
 * preview). On success the account is set to the next cycle, unlocked, and
 * stamped with `reactivatedAt`. The recruiterId / credentials never change.
 */
export function reactivateForCycle(input: {
  recruiterId: string;
  nextCycleId: string;
  amountPaise?: number | undefined;
}): ReactivateResult {
  const nextCycleId = input.nextCycleId.trim();
  if (!nextCycleId) {
    return { ok: false, reason: 'A next cycle is required to reactivate.' };
  }

  const state = loadState();

  const now = new Date();
  const reactivatedAt = now.toISOString();
  // Derive the receipt id from the recruiter serial (e.g. NID-2026-A-0001 →
  // NID-RCPT-2026-A-0001), mirroring payTicketFee; fall back to the full id.
  const serial = input.recruiterId.match(/^NID-(\d{4}-[AB]-\d{4})$/)?.[1] ?? input.recruiterId;
  const receiptId = `NID-RCPT-${serial}`;
  const amountPaise = input.amountPaise ?? DEFAULT_PARTICIPATION_FEE_PAISE;
  const method = 'Demo gateway (UPI)';
  const gatewayRef = `DEMOPAY-${now.getTime().toString(36).toUpperCase()}`;

  const receipt: PaymentReceipt = {
    receiptId,
    amountPaise,
    paidAt: reactivatedAt,
    method,
    gatewayRef,
  };

  const updatedAccount: AccountActivationRecord = {
    recruiterId: input.recruiterId,
    activeCycleId: nextCycleId,
    locked: false,
    reactivatedAt,
  };

  // Queue the reactivation receipt preview to the recruiter's company contacts
  // when we can resolve them from the onboarding ticket (recruiterId ===
  // ticketId). Mirrors payTicketFee's email + SMS pair. Mock; nothing is sent.
  const ticket = state.tickets[input.recruiterId];
  const outboxAdditions: OutboxMessage[] = [];
  if (ticket) {
    outboxAdditions.push({
      id: `outbox_${input.recruiterId}_reactivate_${now.getTime()}`,
      ticketId: input.recruiterId,
      channel: 'email',
      to: ticket.corporateEmail,
      templateId: 'account.reactivated',
      renderedSubject: `NID Industry Interface — account reactivated for the new cycle (${receiptId})`,
      renderedBody:
        `Dear ${ticket.contactName},\n\n` +
        `Your participation fee of ₹${(amountPaise / 100).toLocaleString('en-IN')} for the new placement cycle has been received. ` +
        `Your existing login continues to work — your account is active again.\n\n` +
        `Receipt: ${receiptId}\nGateway ref: ${gatewayRef}\n\n` +
        `— NID Industry Interface`,
      queuedAt: reactivatedAt,
    });
    outboxAdditions.push({
      id: `outbox_${input.recruiterId}_reactivate_sms_${now.getTime()}`,
      ticketId: input.recruiterId,
      channel: 'sms',
      to: ticket.contactPhone,
      templateId: 'account.reactivated.sms',
      renderedBody:
        `NID Industry Interface: participation fee of ₹${(amountPaise / 100).toLocaleString('en-IN')} received. ` +
        `Your account is reactivated for the new cycle. Receipt ${receiptId}.`,
      queuedAt: reactivatedAt,
    });
  }

  persist({
    ...state,
    accounts: { ...state.accounts, [input.recruiterId]: updatedAccount },
    ...(outboxAdditions.length > 0
      ? { outbox: [...state.outbox, ...outboxAdditions] }
      : {}),
  });

  return { ok: true, receipt };
}
