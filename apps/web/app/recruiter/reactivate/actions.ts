'use server';

import {
  reactivateForCycle,
  type ReactivateOutcome,
} from '@nid/module-recruiter-onboarding';

/**
 * Demo participation-fee payment for the re-activation screen (plan Round 3 §C).
 *
 * The recruiter's account is locked at cycle wind-down; paying the next cycle's
 * participation fee unlocks it. This is a mock — `reactivateForCycle` mints a
 * genuine `PaymentReceipt` (and queues an email + SMS preview in the onboarding
 * outbox), unlocks the account, and moves it to `nextCycleId`. No real gateway,
 * no PFMS settlement. The `recruiterId`/credentials never change.
 *
 * The chosen `method` label is cosmetic gateway flavour; the receipt's method is
 * fixed by the module so the demo receipt is identical to the one the apply flow
 * mints. The returned `ReactivateOutcome` carries the receipt for the screen.
 */
export async function reactivateAction(input: {
  recruiterId: string;
  nextCycleId: string;
  amountPaise: number;
}): Promise<ReactivateOutcome> {
  return reactivateForCycle({
    recruiterId: input.recruiterId,
    nextCycleId: input.nextCycleId,
    amountPaise: input.amountPaise,
  });
}
