'use server';

import { revalidatePath } from 'next/cache';
import { createDraft, submitForModeration } from '@nid/module-jd-posting';
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

export async function saveNewDraftAction(payload: JdWizardPayload): Promise<JdWizardActionResult> {
  const result = createDraft(await withContext(payload));
  if (!result.ok) return { ok: false, failure: result.failure };
  revalidatePath('/recruiter/jds');
  return { ok: true };
}

export async function submitNewJdAction(payload: JdWizardPayload): Promise<JdWizardActionResult> {
  const result = submitForModeration(await withContext(payload));
  if (!result.ok) return { ok: false, failure: result.failure };
  revalidatePath('/recruiter/jds');
  return { ok: true };
}
