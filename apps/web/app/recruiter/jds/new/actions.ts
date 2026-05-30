'use server';

import { revalidatePath } from 'next/cache';
import { createDraft, submitForModeration } from '@nid/module-jd-posting';
import { isAccountLocked } from '@nid/module-recruiter-onboarding';
import { readRecruiterSession } from '~/lib/recruiter-session';
import type { JdWizardActionResult, JdWizardPayload } from './wizard-types';

/**
 * Server actions for the *new* JD wizard (plan §N). Self-contained to this
 * route so the wizard's richer Round 2 payload (per-programme compensation +
 * evaluation task) flows straight into the module without touching the legacy
 * shared `../actions.ts`. The module's Zod schema is the authoritative
 * validator; we only attach the recruiter/cycle context from the session.
 *
 * The wizard serializes its structured state to a plain object and calls these
 * via `startTransition`, so we avoid FormData array-encoding for skills /
 * responsibilities / programme compensation.
 */

async function withContext(payload: JdWizardPayload) {
  const session = await readRecruiterSession();
  return { ...payload, recruiterId: session.recruiterId, cycleId: session.cycleId };
}

/**
 * Server-side cycle-lock guard (Round 3 §C). When the recruiter's account is
 * locked between cycles, the dashboard shows the locked panel — but the write
 * paths must refuse too, so a locked recruiter can't post/draft a JD by
 * navigating straight to /recruiter/jds/new. Returns a gate failure to surface
 * if locked, else null.
 */
async function lockedFailure(): Promise<JdWizardActionResult | null> {
  const session = await readRecruiterSession();
  if (!isAccountLocked(session.recruiterId)) return null;
  return {
    ok: false,
    failure: {
      kind: 'schema',
      message:
        'This placement cycle has closed and your account is locked. Reactivate for the next cycle (re-pay the participation fee) before posting JDs.',
    },
  };
}

export async function saveNewDraftAction(payload: JdWizardPayload): Promise<JdWizardActionResult> {
  const locked = await lockedFailure();
  if (locked) return locked;
  const result = createDraft(await withContext(payload));
  if (!result.ok) return { ok: false, failure: result.failure };
  revalidatePath('/recruiter/jds');
  return { ok: true };
}

export async function submitNewJdAction(payload: JdWizardPayload): Promise<JdWizardActionResult> {
  const locked = await lockedFailure();
  if (locked) return locked;
  const result = submitForModeration(await withContext(payload));
  if (!result.ok) return { ok: false, failure: result.failure };
  revalidatePath('/recruiter/jds');
  return { ok: true };
}
