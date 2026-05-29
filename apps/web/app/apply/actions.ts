'use server';

import { submit, advance, pay, type PaymentReceipt } from '@nid/module-recruiter-onboarding';
import { cycleBySlug, CURRENT_CYCLES } from '~/lib/public-content';
import type { ApplyFormState, IssuedTicket } from './state';

const DEMO_CYCLE_SLUG = 'spring-2026';

/** Participation fee (paise) for the demo cycle, sourced from public-content. */
function feeAmountPaiseForDemo(): number {
  const cycle = cycleBySlug(DEMO_CYCLE_SLUG) ?? CURRENT_CYCLES[0];
  const rupees = cycle?.participationFeeRupees ?? 15_000;
  return rupees * 100;
}

export async function submitApplyAction(
  _prev: ApplyFormState,
  formData: FormData,
): Promise<ApplyFormState> {
  // Collect form values for re-rendering on validation failure.
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value;
  }

  const phoneVerified = values['phoneVerified'] === 'true';

  const input = {
    companyName: values['companyName'] ?? '',
    sector: values['sector'] ?? '',
    gst: (values['gst'] ?? '').toUpperCase(),
    registrationNumber: values['registrationNumber'] ?? '',
    corporateEmail: values['corporateEmail'] ?? '',
    websiteUrl: values['websiteUrl'] ?? '',
    contactName: values['contactName'] ?? '',
    contactPhone: values['contactPhone'] ?? '',
    cycleId: values['cycleId'] ?? 'cycle_spring_2026',
    phoneVerified,
  };

  const result = submit(input);
  if (!result.ok) {
    return {
      status: 'error',
      message: result.message,
      fieldErrors: result.fieldErrors,
      values,
    };
  }

  // §G: do NOT redirect. Hand the issued ticket back so the client opens the
  // post-submit overlay (ticket → pay → receipt → track).
  const ticket: IssuedTicket = {
    ticketId: result.result.ticketId,
    trackerPath: result.result.trackerPath,
    status: 'application-received',
    companyName: input.companyName,
    contactName: input.contactName,
    corporateEmail: input.corporateEmail,
    contactPhone: input.contactPhone,
    phoneVerified,
    feeAmountPaise: feeAmountPaiseForDemo(),
  };

  return {
    status: 'submitted',
    message: '',
    fieldErrors: {},
    values: {},
    ticket,
  };
}

/**
 * Demo participation-fee payment for the post-submit overlay (plan §G).
 *
 * Routes through the recruiter-onboarding public API so the receipt is genuine
 * and lands in the real onboarding outbox (email + SMS previews). The module's
 * `pay` only settles a `fee-due` ticket, while a freshly submitted ticket is
 * still `application-received`; so we first `advance` it through the canonical
 * transitions (verification-pending → fee-due) — both public API, no contract
 * change — then `pay`. The resulting `PaymentReceipt` is returned to the
 * overlay. No real gateway, no PFMS settlement.
 *
 * Falls back to an inline receipt of the identical shape only if the store path
 * is unavailable (e.g. ticket already past `fee-due`), so the demo never stalls.
 */
export async function payTicketAction(input: {
  ticketId: string;
  amountPaise: number;
  method: string;
}): Promise<PaymentReceipt> {
  // Walk the ticket to `fee-due` so the real `pay` can settle it. Idempotent
  // enough for the demo: each call appends history, then pays once.
  advance({
    ticketId: input.ticketId,
    toStatus: 'verification-pending',
    note: 'Auto-verified for demo so the participation fee can be paid immediately.',
  });
  advance({
    ticketId: input.ticketId,
    toStatus: 'fee-due',
    note: 'Participation fee invoice issued.',
    feeAmountPaise: input.amountPaise,
  });

  const paid = pay({ ticketId: input.ticketId, method: input.method });
  if (paid) return paid.receipt;

  // Defensive fallback — same shape as the module receipt.
  const now = new Date();
  const serial = input.ticketId.match(/^NID-(\d{4}-[AB]-\d{4})$/)?.[1] ?? input.ticketId;
  return {
    receiptId: `NID-RCPT-${serial}`,
    amountPaise: input.amountPaise,
    paidAt: now.toISOString(),
    method: input.method,
    gatewayRef: `DEMOPAY-${now.getTime().toString(36).toUpperCase()}`,
  };
}
