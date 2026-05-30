import {
  applyFormSchema,
  type ApplicationTicketRecord,
  type PaymentReceipt,
  type RecruiterStatus,
} from './types';
import {
  getTicketStatus as storeGetTicketStatus,
  listOutboxForTicket as storeListOutbox,
  listAllTickets as storeListAll,
  listOutboxAll as storeListOutboxAll,
  submitApplication as storeSubmitApplication,
  advanceTicketStatus as storeAdvance,
  payTicketFee as storePayFee,
  updateContactDetails as storeUpdateContactDetails,
  getAccountState as storeGetAccountState,
  isAccountLocked as storeIsAccountLocked,
  windDownCycle as storeWindDownCycle,
  reactivateForCycle as storeReactivateForCycle,
  queueOfferLetterNotice as storeQueueOfferLetterNotice,
  type SubmitResult,
  type PayResult,
} from './store';
import type { OutboxMessage } from './types';

export interface SubmitOutcome {
  readonly ok: true;
  readonly result: SubmitResult;
}

export interface SubmitFailure {
  readonly ok: false;
  readonly fieldErrors: Record<string, string[]>;
  readonly message: string;
}

export type SubmitApplyResult = SubmitOutcome | SubmitFailure;

/**
 * Validate + submit. Returns a discriminated union so the caller can render
 * field errors without throwing.
 */
export function submit(input: unknown): SubmitApplyResult {
  const parsed = applyFormSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: 'Please fix the highlighted fields and submit again.',
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    };
  }
  const result = storeSubmitApplication(parsed.data);
  return { ok: true, result };
}

export function lookup(ticketId: string): ApplicationTicketRecord | null {
  const cleaned = ticketId.trim().toUpperCase();
  return storeGetTicketStatus(cleaned);
}

export function outboxFor(ticketId: string) {
  return storeListOutbox(ticketId.trim().toUpperCase());
}

export function listAll(): readonly ApplicationTicketRecord[] {
  return storeListAll();
}

export function listOutboxAll() {
  return storeListOutboxAll();
}

export function advance(input: {
  ticketId: string;
  toStatus: RecruiterStatus;
  note?: string | undefined;
  feeAmountPaise?: number | undefined;
}): ApplicationTicketRecord | null {
  return storeAdvance({ ...input, ticketId: input.ticketId.trim().toUpperCase() });
}

/**
 * Record a (mock) participation-fee payment for a `fee-due` ticket and
 * generate its receipt. Used by the post-submit demo payment screen.
 */
export function pay(input: {
  ticketId: string;
  method?: string | undefined;
}): PayResult | null {
  return storePayFee({ ...input, ticketId: input.ticketId.trim().toUpperCase() });
}

export interface UpdateContactResult {
  readonly ok: boolean;
  readonly record?: ApplicationTicketRecord;
  readonly reason?: string;
}

/**
 * Recruiter self-service edit of the editable contact fields (plan §L —
 * corporate email, primary phone, mock phone-verified flag). Identity fields
 * (company name, GST, registration number) are immutable and not accepted here.
 *
 * `recruiterId === ticketId` in this demo. Returns a result object so callers
 * render a reason without throwing. Only the fields actually supplied are
 * applied (conditional spreads), so a partial edit leaves the rest untouched.
 */
export function updateContactDetails(input: {
  recruiterId: string;
  corporateEmail?: string;
  contactPhone?: string;
  phoneVerified?: boolean;
}): UpdateContactResult {
  const ticketId = input.recruiterId.trim().toUpperCase();
  const record = storeUpdateContactDetails({
    ticketId,
    ...(input.corporateEmail !== undefined ? { corporateEmail: input.corporateEmail } : {}),
    ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
    ...(input.phoneVerified !== undefined ? { phoneVerified: input.phoneVerified } : {}),
  });
  if (!record) {
    return { ok: false, reason: 'No company record found for this recruiter.' };
  }
  return { ok: true, record };
}

/**
 * The full company/application record for a recruiter (plan §L profile surface).
 * `recruiterId === ticketId` in this demo, so this reuses the same store lookup
 * `lookup`/`getTicketStatus` use. Returns null if there is no such record.
 */
export function getCompanyRecord(recruiterId: string): ApplicationTicketRecord | null {
  return storeGetTicketStatus(recruiterId.trim().toUpperCase());
}

// ── Account activation / cycle lock (plan Round 3 §C) ───────────────────────

/**
 * A recruiter's account-activation state (active cycle + lock). Defaults to the
 * seeded active state when no record exists. `recruiterId === ticketId`.
 */
export function getAccountState(
  recruiterId: string,
): { activeCycleId: string; locked: boolean; reactivatedAt?: string } {
  return storeGetAccountState(recruiterId.trim().toUpperCase());
}

/** Whether a recruiter's account is currently locked (defaults to unlocked). */
export function isAccountLocked(recruiterId: string): boolean {
  return storeIsAccountLocked(recruiterId.trim().toUpperCase());
}

/**
 * Admin "wind down": lock every recruiter account on `cycleId`. Returns how
 * many accounts were newly locked. Credentials are untouched.
 */
export function windDownCycle(cycleId: string): number {
  return storeWindDownCycle(cycleId);
}

/**
 * Queue the offer-letter-delivered notice to the student on both channels
 * (email + SMS, templateId `offer.letter.delivered`), mirroring `pay`'s
 * dual-channel Outbox pair. Called by the web action that sends a signed offer
 * letter so the Outbox write stays inside this owning module. Only the channels
 * whose destination is supplied are queued (conditional spreads —
 * exactOptionalPropertyTypes safe). Returns the queued messages.
 *
 * `recruiterId === ticketId` in this demo, so it doubles as the Outbox grouping
 * key the comms log already filters on.
 */
export function queueOfferLetterNotice(input: {
  recruiterId: string;
  studentEmail?: string | undefined;
  studentPhone?: string | undefined;
  jdTitle: string;
  verifyPath: string;
}): readonly OutboxMessage[] {
  return storeQueueOfferLetterNotice({
    recruiterId: input.recruiterId.trim().toUpperCase(),
    jdTitle: input.jdTitle,
    verifyPath: input.verifyPath,
    ...(input.studentEmail !== undefined ? { studentEmail: input.studentEmail } : {}),
    ...(input.studentPhone !== undefined ? { studentPhone: input.studentPhone } : {}),
  });
}

export interface ReactivateOutcome {
  readonly ok: boolean;
  readonly receipt?: PaymentReceipt;
  readonly reason?: string;
}

/**
 * Reactivate a recruiter for the next cycle by re-paying the participation fee
 * (mock — mirrors `pay`: mints a receipt + queues an email/SMS preview), then
 * unlocks the account and moves it to the next cycle. The recruiterId /
 * credentials never change. Returns a result object so callers render a reason
 * without throwing.
 */
export function reactivateForCycle(input: {
  recruiterId: string;
  nextCycleId: string;
  amountPaise?: number;
}): ReactivateOutcome {
  return storeReactivateForCycle({
    recruiterId: input.recruiterId.trim().toUpperCase(),
    nextCycleId: input.nextCycleId,
    ...(input.amountPaise !== undefined ? { amountPaise: input.amountPaise } : {}),
  });
}
