'use server';

import { revalidatePath } from 'next/cache';
import { getJd, submitForModeration, updateDraft } from '@nid/module-jd-posting';
import { readRecruiterSession } from '~/lib/recruiter-session';
import type { JdWizardActionResult, JdWizardPayload } from '../../new/wizard-types';

/**
 * Server actions for the draft-edit route (plan §N / §M — "Edit draft"). Reuse
 * the upgraded wizard against an existing draft:
 *  - Save draft   → updateDraft (permissive; only `draft`-status records).
 *  - Save & resubmit → submitForModeration(existingJdId) so the draft is frozen
 *    in place rather than duplicated.
 *
 * Both verify the draft still belongs to the session recruiter before writing,
 * so the route can't be used to edit another recruiter's draft via a guessed
 * id. The module's Zod schema validates the payload at the boundary.
 */

async function guardedContext(draftId: string, payload: JdWizardPayload) {
  const session = await readRecruiterSession();
  const existing = getJd(draftId);
  if (!existing || existing.recruiterId !== session.recruiterId) {
    return null;
  }
  return { ...payload, recruiterId: session.recruiterId, cycleId: session.cycleId };
}

export async function updateDraftAction(
  draftId: string,
  payload: JdWizardPayload,
): Promise<JdWizardActionResult> {
  const input = await guardedContext(draftId, payload);
  if (!input) {
    return { ok: false, failure: { kind: 'schema', message: 'Draft not found for this recruiter.' } };
  }
  const result = updateDraft(draftId, input);
  if (!result.ok) {
    // updateDraft can fail with either a GateFailure (schema) or a plain reason.
    if ('failure' in result) return { ok: false, failure: result.failure };
    return { ok: false, failure: { kind: 'schema', message: result.reason } };
  }
  revalidatePath('/recruiter/jds');
  revalidatePath(`/recruiter/jds/${draftId}/edit`);
  return { ok: true };
}

export async function submitEditedJdAction(
  draftId: string,
  payload: JdWizardPayload,
): Promise<JdWizardActionResult> {
  const input = await guardedContext(draftId, payload);
  if (!input) {
    return { ok: false, failure: { kind: 'schema', message: 'Draft not found for this recruiter.' } };
  }
  const result = submitForModeration(input, draftId);
  if (!result.ok) return { ok: false, failure: result.failure };
  revalidatePath('/recruiter/jds');
  return { ok: true };
}
