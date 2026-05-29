import { applyFormSchema, type ApplicationTicketRecord, type RecruiterStatus } from './types';
import {
  getTicketStatus as storeGetTicketStatus,
  listOutboxForTicket as storeListOutbox,
  listAllTickets as storeListAll,
  listOutboxAll as storeListOutboxAll,
  submitApplication as storeSubmitApplication,
  advanceTicketStatus as storeAdvance,
  payTicketFee as storePayFee,
  type SubmitResult,
  type PayResult,
} from './store';

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
