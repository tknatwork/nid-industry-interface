import {
  canIssueOffers,
  describeCascade,
  isDeadlinePassed,
  nextInSequence,
  type CascadeAction,
  type Offer as CoreOffer,
} from '@nid/core';
import {
  issueOfferSchema,
  lockSequenceSchema,
  responseSchema,
  simulateDeadlineSchema,
  type ActionResult,
  type OfferRecord,
} from './types';
import {
  expireOffer,
  getSequence,
  hasActiveOffer,
  hasDeclined,
  insertOffer,
  lockSequence,
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

function stateFor(jdId: string, positions: number, shortlistRemaining: number, currentWave: number) {
  const offers = offersForJd(jdId);
  let outstanding = 0;
  let accepted = 0;
  let declinedOrExpired = 0;
  for (const o of offers) {
    if (o.status === 'pending') outstanding += 1;
    else if (o.status === 'accepted') accepted += 1;
    else declinedOrExpired += 1;
  }
  return { positions, outstanding, accepted, declinedOrExpired, shortlistRemaining, currentWave };
}

/**
 * The wave this issuance joins (Round 2 §S). A wave is a batch: a new wave
 * starts only once the prior wave has no pending offers left (declines/expires
 * reopened slots). While a wave still has pending offers, further issuances
 * join that same wave. This keeps the 3-wave cap counting batches, not
 * individual offers.
 */
function targetWaveFor(jdId: string): number {
  const offers = offersForJd(jdId);
  if (offers.length === 0) return 1;
  const maxWave = offers.reduce((max, o) => Math.max(max, o.wave), 0);
  const hasPendingInMaxWave = offers.some((o) => o.wave === maxWave && o.status === 'pending');
  return hasPendingInMaxWave ? maxWave : maxWave + 1;
}

/**
 * Students who already hold (or held) an offer for this JD, in any status. The
 * locked-sequence walk skips these so `nextInSequence` always points at the next
 * un-offered student in the recruiter's order.
 */
function alreadyOfferedSet(jdId: string): ReadonlySet<string> {
  return new Set(offersForJd(jdId).map((o) => o.studentId));
}

/**
 * Issue one offer — gated by @nid/core canIssueOffers (the position cap, UNCHANGED).
 *
 * Round 4: once a float sequence is locked for the JD, issuance is strictly
 * in-order — the only student that may be offered is the next un-offered entry
 * in the locked order (`nextInSequence`). Out-of-sequence issuance is refused.
 * When a sequence is locked, the issued offer carries its `sequenceIndex` (the
 * student's position in the order) and a `deadlineIso = issuedAt + deadlineHours`.
 * Without a locked sequence the historical behaviour is preserved (no order
 * guard; no sequenceIndex).
 */
export function issueOffer(input: unknown): ActionResult {
  const parsed = issueOfferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const { jdId, studentId, positions, shortlistRemaining, ctcPaise, stipendPaise, deadlineHours } = parsed.data;

  if (hasDeclined(jdId, studentId)) {
    return { ok: false, reason: 'This candidate declined a prior offer for this JD.' };
  }
  if (hasActiveOffer(jdId, studentId)) {
    return { ok: false, reason: 'This candidate already has an active offer.' };
  }

  // Out-of-sequence guard — only when a float order is locked for this JD.
  const sequence = getSequence(jdId);
  let sequenceIndex: number | undefined;
  if (sequence) {
    const idx = sequence.order.indexOf(studentId);
    if (idx === -1) {
      return { ok: false, reason: 'This candidate is not in the locked float sequence.' };
    }
    const [next] = nextInSequence(sequence.order, alreadyOfferedSet(jdId), 1);
    if (next !== studentId) {
      return {
        ok: false,
        reason: next
          ? `Out of sequence — the next offer in the locked order goes to ${next}.`
          : 'The locked float sequence is exhausted.',
      };
    }
    sequenceIndex = idx;
  }

  // A wave is a batch: this issuance joins the current wave while it still has
  // pending offers, else it opens the next wave. Passing `currentWave = wave - 1`
  // to the gate makes the 3-wave cap block exactly when this would open Wave 4+.
  const wave = targetWaveFor(jdId);
  const gate = canIssueOffers(stateFor(jdId, positions, shortlistRemaining, wave - 1), 1);
  if (!gate.allowed) return { ok: false, reason: gate.reason ?? 'Cap reached' };

  const issuedAt = new Date().toISOString();
  const deadlineIso = new Date(new Date(issuedAt).getTime() + deadlineHours * 60 * 60 * 1000).toISOString();

  insertOffer({
    jdId,
    studentId,
    wave,
    status: 'pending',
    issuedAt,
    deadlineIso,
    ...(sequenceIndex !== undefined ? { sequenceIndex } : {}),
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

/**
 * Lock the float order for a JD (Round 4 §D). One-shot — a second lock is
 * refused by the store. The `order` must be exactly the After-selected set
 * (`selectedIds`): same members, no extras, no omissions. Order itself is the
 * recruiter's chosen priority and is preserved. The caller guarantees
 * `interviewsComplete` (the Offers-unlock gate) before invoking this.
 */
export function lockFloatSequence(input: unknown, selectedIds: readonly string[]): ActionResult {
  const parsed = lockSequenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const { jdId, order } = parsed.data;

  const selected = new Set(selectedIds);
  if (order.length !== selected.size) {
    return { ok: false, reason: 'The sequence must contain exactly the selected candidates.' };
  }
  const seen = new Set<string>();
  for (const id of order) {
    if (!selected.has(id)) {
      return { ok: false, reason: 'The sequence contains a candidate that was not selected.' };
    }
    if (seen.has(id)) {
      return { ok: false, reason: 'The sequence contains a duplicate candidate.' };
    }
    seen.add(id);
  }

  const res = lockSequence(jdId, order);
  return res.ok ? { ok: true } : { ok: false, reason: res.reason };
}

/**
 * Lazily expire any pending offer whose `deadlineIso` has lapsed (Round 4 §D —
 * no background scheduler; evaluated on load/action). Returns the studentIds
 * swept. Offers without a `deadlineIso` never auto-expire here.
 */
export function sweepExpiredOffers(jdId: string, now: Date = new Date()): { expired: readonly string[] } {
  const expired: string[] = [];
  for (const o of offersForJd(jdId)) {
    if (o.status === 'pending' && o.deadlineIso && isDeadlinePassed(o.deadlineIso, now)) {
      const updated = expireOffer(jdId, o.studentId, 'Response window elapsed', now.toISOString());
      if (updated) expired.push(o.studentId);
    }
  }
  return { expired };
}

/**
 * Float the next offers in the locked sequence to backfill open slots, within
 * the position cap (Round 4 §D). Sweeps lapsed deadlines first so reopened slots
 * are counted, then issues to the next un-offered students in order — never
 * exceeding `canIssueOffers`. No-op without a locked sequence. Returns the
 * studentIds newly floated.
 *
 * `selectedIds` is the After-selected pool, used only to size the shortlist the
 * cap gate sees (the order itself comes from the locked sequence).
 */
export function autoFloatNext(
  jdId: string,
  positions: number,
  selectedIds: readonly string[],
  now: Date = new Date(),
): { floated: readonly string[] } {
  sweepExpiredOffers(jdId, now);

  const sequence = getSequence(jdId);
  if (!sequence) return { floated: [] };

  const floated: string[] = [];
  // Re-evaluate live counts after every issue so the cap is respected exactly.
  // The locked order is finite, so this loop terminates once it is exhausted or
  // the cap/shortlist blocks the next float.
  for (;;) {
    const offers = offersForJd(jdId);
    let outstanding = 0;
    let accepted = 0;
    for (const o of offers) {
      if (o.status === 'pending') outstanding += 1;
      else if (o.status === 'accepted') accepted += 1;
    }
    const openSlots = positions - (outstanding + accepted);
    if (openSlots <= 0) break;

    const offered = offers.map((o) => o.studentId);
    const [next] = nextInSequence(sequence.order, new Set(offered), 1);
    if (!next) break; // sequence exhausted

    const shortlistRemaining = selectedIds.filter((id) => !offered.includes(id)).length;
    const result = issueOffer({ jdId, studentId: next, positions, shortlistRemaining });
    if (!result.ok) break; // cap / wave / shortlist gate stopped us
    floated.push(next);
  }

  return { floated };
}

/**
 * Demo control (Round 4 §D): treat a pending offer's deadline as just-lapsed and
 * expire it now — so a recruiter can exercise the decline/timeout → auto-float
 * path without waiting out a real 48h window. The lazy sweep would reach the
 * same state once the clock crossed `deadlineIso`; this forces it immediately.
 */
export function simulateDeadlinePassed(input: unknown): ActionResult {
  const parsed = simulateDeadlineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const { jdId, studentId } = parsed.data;
  const updated = expireOffer(jdId, studentId, 'Deadline passed (simulated)', new Date().toISOString());
  return updated ? { ok: true } : { ok: false, reason: 'No pending offer to expire' };
}

export function listOffers(jdId: string): readonly OfferRecord[] {
  return offersForJd(jdId);
}

/** The locked float order for a JD, or null if none locked. Re-exported for the UI. */
export { getSequence } from './store';

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
