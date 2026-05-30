import type { Offer } from '../entities/offer';

/**
 * Wave-based offer cascade enforcement (Phase 4.8 + Phase 5.4 + Round 2 §S).
 *
 * Hard cap: `outstanding + accepted <= positions`. No buffer escape valve.
 * Wave cap: Wave 1 + up to 2 more = `MAX_WAVES` (3) total. The "Float next
 * wave" action floats only while declined/expired offers from prior waves have
 * created open slots AND the next wave would be within the wave cap. After the
 * cap is reached, auto-floating stops with a "waves exhausted" state — the
 * recruiter closes the JD (unfilled) or re-engages the broader pool.
 */

/** Wave 1 + up to 2 more. After this many waves, auto-floating stops. */
export const MAX_WAVES = 3;

export interface CascadeState {
  readonly positions: number;
  readonly outstanding: number; // pending or on-hold
  readonly accepted: number;
  readonly declinedOrExpired: number;
  readonly shortlistRemaining: number;
  /** Highest wave number already floated (0 = none yet). Optional for callers
   *  that do not track waves; the wave cap is only enforced when provided. */
  readonly currentWave?: number;
  /** Override the wave cap. Defaults to {@link MAX_WAVES}. */
  readonly maxWaves?: number;
}

export interface CascadeAction {
  readonly canFloatNextWave: boolean;
  readonly availableSlots: number;
  readonly nextWaveSize: number;
  /** Highest wave already floated (0 = none yet). */
  readonly currentWave: number;
  /** The wave a "Float next wave" action would create (`currentWave + 1`). */
  readonly nextWave: number;
  /** The wave cap in force (Wave 1 + up to 2 more = 3 by default). */
  readonly maxWaves: number;
  /** True once `currentWave >= maxWaves`: no further waves may float. */
  readonly wavesExhausted: boolean;
  readonly reasonIfBlocked?: string;
}

export function describeCascade(
  offers: readonly Offer[],
  positions: number,
  shortlistRemaining: number,
  maxWaves: number = MAX_WAVES,
): CascadeAction {
  let outstanding = 0;
  let accepted = 0;
  let declinedOrExpired = 0;
  let currentWave = 0;

  for (const offer of offers) {
    if (offer.status === 'pending' || offer.status === 'on-hold') outstanding += 1;
    else if (offer.status === 'accepted') accepted += 1;
    else if (offer.status === 'declined' || offer.status === 'expired') declinedOrExpired += 1;
    if (offer.wave > currentWave) currentWave = offer.wave;
  }

  const availableSlots = positions - (outstanding + accepted);
  const nextWave = currentWave + 1;
  const wavesExhausted = currentWave >= maxWaves;
  const base = { availableSlots, currentWave, nextWave, maxWaves, wavesExhausted } as const;

  if (availableSlots <= 0) {
    return {
      ...base,
      canFloatNextWave: false,
      nextWaveSize: 0,
      reasonIfBlocked: 'All positions covered by outstanding or accepted offers',
    };
  }

  if (wavesExhausted) {
    return {
      ...base,
      canFloatNextWave: false,
      nextWaveSize: 0,
      reasonIfBlocked: `Waves exhausted (${currentWave} of ${maxWaves}) — close the JD or re-engage the pool`,
    };
  }

  if (shortlistRemaining <= 0) {
    return {
      ...base,
      canFloatNextWave: false,
      nextWaveSize: 0,
      reasonIfBlocked: 'Shortlist exhausted; broaden the candidate pool or close the JD',
    };
  }

  return {
    ...base,
    canFloatNextWave: true,
    nextWaveSize: Math.min(availableSlots, shortlistRemaining),
  };
}

/**
 * Used to validate every offer-creation mutation. Returns the reason if the
 * caller would breach the position cap, the shortlist, or the wave cap by
 * issuing N more offers. The wave cap is enforced only when `currentWave` is
 * supplied: issuing past the final wave is blocked.
 */
export function canIssueOffers(
  currentState: CascadeState,
  additionalOffers: number,
): { allowed: boolean; reason?: string } {
  const projected = currentState.outstanding + currentState.accepted + additionalOffers;
  if (projected > currentState.positions) {
    return {
      allowed: false,
      reason: `Issuing ${additionalOffers} more offers would exceed position cap (${projected} > ${currentState.positions})`,
    };
  }
  if (additionalOffers > currentState.shortlistRemaining) {
    return {
      allowed: false,
      reason: `Not enough shortlisted candidates remain (need ${additionalOffers}, have ${currentState.shortlistRemaining})`,
    };
  }
  if (currentState.currentWave !== undefined) {
    const maxWaves = currentState.maxWaves ?? MAX_WAVES;
    if (currentState.currentWave >= maxWaves) {
      return {
        allowed: false,
        reason: `Waves exhausted (${currentState.currentWave} of ${maxWaves}) — close the JD or re-engage the pool`,
      };
    }
  }
  return { allowed: true };
}

/**
 * Pick the next `count` students to float, walking the locked float `order`
 * (Round 4 §D) and skipping anyone already offered. Pure: preserves sequence
 * order, never reorders, and stops once `count` slots are filled. Duplicate IDs
 * in `order` are de-duplicated (an id offered earlier in this same pass is not
 * floated twice). A non-positive `count` yields an empty result.
 *
 * NOTE: this returns at most `count` ids; it does NOT itself enforce the
 * position cap — `canIssueOffers` remains the gate the caller must consult.
 */
export function nextInSequence(
  order: readonly string[],
  alreadyOffered: ReadonlySet<string>,
  count: number,
): readonly string[] {
  if (count <= 0) return [];
  const picked: string[] = [];
  const seen = new Set<string>();
  for (const studentId of order) {
    if (picked.length >= count) break;
    if (alreadyOffered.has(studentId) || seen.has(studentId)) continue;
    seen.add(studentId);
    picked.push(studentId);
  }
  return picked;
}

/**
 * True once `now` is at or past the wave's acceptance deadline. The boundary is
 * inclusive: an offer is considered lapsed exactly at the deadline instant. A
 * malformed/unparseable `deadlineIso` is treated as NOT passed (fail-open so a
 * bad timestamp never silently expires a live offer; the caller may validate).
 */
export function isDeadlinePassed(deadlineIso: string, now: Date): boolean {
  const deadlineMs = Date.parse(deadlineIso);
  if (Number.isNaN(deadlineMs)) return false;
  return now.getTime() >= deadlineMs;
}

/**
 * Whole minutes remaining until the wave deadline (floored). Zero at or past
 * the deadline — never negative — so countdown UIs clamp cleanly to "0m".
 * A malformed `deadlineIso` yields 0.
 */
export function minutesToDeadline(deadlineIso: string, now: Date): number {
  const deadlineMs = Date.parse(deadlineIso);
  if (Number.isNaN(deadlineMs)) return 0;
  const remainingMs = deadlineMs - now.getTime();
  if (remainingMs <= 0) return 0;
  return Math.floor(remainingMs / 60_000);
}
