import { applyFormSchema, type ApplicationTokenRecord, type RecruiterStatus } from './types';
import {
  getTokenStatus as storeGetTokenStatus,
  listOutboxForToken as storeListOutbox,
  listAllTokens as storeListAll,
  listOutboxAll as storeListOutboxAll,
  submitApplication as storeSubmitApplication,
  advanceTokenStatus as storeAdvance,
  type SubmitResult,
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

export function lookup(tokenId: string): ApplicationTokenRecord | null {
  const cleaned = tokenId.trim().toUpperCase();
  return storeGetTokenStatus(cleaned);
}

export function outboxFor(tokenId: string) {
  return storeListOutbox(tokenId.trim().toUpperCase());
}

export function listAll(): readonly ApplicationTokenRecord[] {
  return storeListAll();
}

export function listOutboxAll() {
  return storeListOutboxAll();
}

export function advance(input: {
  tokenId: string;
  toStatus: RecruiterStatus;
  note?: string;
  feeAmountPaise?: number;
}): ApplicationTokenRecord | null {
  return storeAdvance({ ...input, tokenId: input.tokenId.trim().toUpperCase() });
}
