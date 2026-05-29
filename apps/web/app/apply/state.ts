/**
 * Plain types + initial state for the apply form. Lives outside the
 * "use server" module so Next.js doesn't choke on non-function exports.
 *
 * §G: on a successful submit we no longer redirect straight to the tracker.
 * Instead the action returns a `submitted` state carrying the freshly issued
 * ticket id + status + the channels it was "sent" to, so the client can open
 * the post-submit Ticket Overlay (ticket → pay → receipt → track).
 */

import type { RecruiterStatus } from '@nid/module-recruiter-onboarding';

/** Lightweight view of the issued ticket the overlay needs — no PII beyond
 * what the recruiter just typed (their own email + phone). */
export interface IssuedTicket {
  readonly ticketId: string;
  readonly trackerPath: string;
  readonly status: RecruiterStatus;
  readonly companyName: string;
  readonly contactName: string;
  readonly corporateEmail: string;
  readonly contactPhone: string;
  readonly phoneVerified: boolean;
  /** Live participation fee for this cycle, in paise (from public-content). */
  readonly feeAmountPaise: number;
}

export interface ApplyFormState {
  readonly status: 'idle' | 'error' | 'submitted';
  readonly message: string;
  readonly fieldErrors: Record<string, string[]>;
  readonly values: Record<string, string>;
  /** Present only when `status === 'submitted'`. */
  readonly ticket?: IssuedTicket;
}

export const initialApplyState: ApplyFormState = {
  status: 'idle',
  message: '',
  fieldErrors: {},
  values: {},
};
