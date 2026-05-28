import {
  canIssueOffers,
  describeCascade,
  type CascadeAction,
  type Offer as CoreOffer,
} from '@nid/core';
import {
  issueOfferSchema,
  responseSchema,
  type ActionResult,
  type OfferRecord,
} from './types';
import {
  currentMaxWave,
  hasActiveOffer,
  hasDeclined,
  insertOffer,
  offersForJd,
  updateOfferStatus,
} from './store';

/** Map our stored offers to the @nid/core Offer shape the cascade rules expect. */
function toCoreOffers(records: readonly OfferRecord[]): readonly CoreOffer[] {
  return records.map(
    (r) =>
      ({
        id: r.id as CoreOffer['id'],
        jdId: r.jdId as CoreOffer['jdId'],
        studentId: r.studentId as CoreOffer['studentId'],
        wave: r.wave,
        location: '',
        role: '',
        joiningDate: new Date(),
        offerLetterPdfUrl: '',
        status: r.status,
        issuedAt: new Date(r.issuedAt),
        windowExpiresAt: new Date(),
        ...(r.ctcPaise !== undefined ? { ctcPaise: r.ctcPaise } : {}),
        ...(r.stipendPaise !== undefined ? { stipendPaise: r.stipendPaise } : {}),
      }) as CoreOffer,
  );
}

function stateFor(jdId: string, positions: number, shortlistRemaining: number) {
  const offers = offersForJd(jdId);
  let outstanding = 0;
  let accepted = 0;
  let declinedOrExpired = 0;
  for (const o of offers) {
    if (o.status === 'pending') outstanding += 1;
    else if (o.status === 'accepted') accepted += 1;
    else declinedOrExpired += 1;
  }
  return { positions, outstanding, accepted, declinedOrExpired, shortlistRemaining };
}

/** Issue one offer — gated by @nid/core canIssueOffers (the position cap). */
export function issueOffer(input: unknown): ActionResult {
  const parsed = issueOfferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const { jdId, studentId, positions, shortlistRemaining, ctcPaise, stipendPaise } = parsed.data;

  if (hasDeclined(jdId, studentId)) {
    return { ok: false, reason: 'This candidate declined a prior offer for this JD.' };
  }
  if (hasActiveOffer(jdId, studentId)) {
    return { ok: false, reason: 'This candidate already has an active offer.' };
  }

  const gate = canIssueOffers(stateFor(jdId, positions, shortlistRemaining), 1);
  if (!gate.allowed) return { ok: false, reason: gate.reason ?? 'Cap reached' };

  // Wave = next wave number if this issuance starts a new batch; simplest: max+1
  // only when no pending offers remain, else same wave. Keep it simple: bump per call.
  const wave = currentMaxWave(jdId) + 1;
  insertOffer({
    jdId,
    studentId,
    wave,
    status: 'pending',
    issuedAt: new Date().toISOString(),
    ...(ctcPaise !== undefined ? { ctcPaise } : {}),
    ...(stipendPaise !== undefined ? { stipendPaise } : {}),
  });
  return { ok: true };
}

/** Record a student response (accept/decline/expire). Demo control until the student portal lands. */
export function recordResponse(input: unknown): ActionResult {
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const updated = updateOfferStatus(parsed.data.jdId, parsed.data.studentId, parsed.data.status, parsed.data.reason);
  return updated ? { ok: true } : { ok: false, reason: 'No pending offer to update' };
}

export function listOffers(jdId: string): readonly OfferRecord[] {
  return offersForJd(jdId);
}

/** Cascade availability for the UI — delegates to @nid/core describeCascade. */
export function cascadeFor(jdId: string, positions: number, shortlistRemaining: number): CascadeAction {
  return describeCascade(toCoreOffers(offersForJd(jdId)), positions, shortlistRemaining);
}

export function tallyFor(jdId: string, positions: number) {
  const offers = offersForJd(jdId);
  const accepted = offers.filter((o) => o.status === 'accepted').length;
  const outstanding = offers.filter((o) => o.status === 'pending').length;
  const declined = offers.filter((o) => o.status === 'declined' || o.status === 'expired').length;
  return { positions, accepted, outstanding, declined, filled: accepted };
}
