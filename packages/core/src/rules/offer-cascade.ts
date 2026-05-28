import type { Offer } from '../entities/offer.js';

/**
 * Wave-based offer cascade enforcement (Phase 4.8 + Phase 5.4).
 *
 * Hard cap: `outstanding + accepted <= positions`. No buffer escape valve.
 * The "Float next wave" action is allowed only when declined/expired offers
 * from the prior wave have created equivalent open slots.
 */

export interface CascadeState {
  readonly positions: number;
  readonly outstanding: number; // pending or on-hold
  readonly accepted: number;
  readonly declinedOrExpired: number;
  readonly shortlistRemaining: number;
}

export interface CascadeAction {
  readonly canFloatNextWave: boolean;
  readonly availableSlots: number;
  readonly nextWaveSize: number;
  readonly reasonIfBlocked?: string;
}

export function describeCascade(offers: readonly Offer[], positions: number, shortlistRemaining: number): CascadeAction {
  let outstanding = 0;
  let accepted = 0;
  let declinedOrExpired = 0;

  for (const offer of offers) {
    if (offer.status === 'pending' || offer.status === 'on-hold') outstanding += 1;
    else if (offer.status === 'accepted') accepted += 1;
    else if (offer.status === 'declined' || offer.status === 'expired') declinedOrExpired += 1;
  }

  const availableSlots = positions - (outstanding + accepted);

  if (availableSlots <= 0) {
    return {
      canFloatNextWave: false,
      availableSlots,
      nextWaveSize: 0,
      reasonIfBlocked: 'All positions covered by outstanding or accepted offers',
    };
  }

  if (shortlistRemaining <= 0) {
    return {
      canFloatNextWave: false,
      availableSlots,
      nextWaveSize: 0,
      reasonIfBlocked: 'Shortlist exhausted; broaden the candidate pool or close the JD',
    };
  }

  return {
    canFloatNextWave: true,
    availableSlots,
    nextWaveSize: Math.min(availableSlots, shortlistRemaining),
  };
}

/**
 * Used to validate every offer-creation mutation. Returns the reason if the
 * caller would breach the cap by issuing N more offers.
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
  return { allowed: true };
}
