'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createDraft,
  submitForModeration,
  discardDraft,
  type GateFailure,
} from '@nid/module-jd-posting';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';

export interface JdActionOk {
  readonly ok: true;
  readonly jdId: string;
  readonly status: string;
}
export interface JdActionFail {
  readonly ok: false;
  readonly failure: GateFailure;
}
export type JdActionResult = JdActionOk | JdActionFail;

// The client serializes the structured wizard state to a plain object and
// passes it directly to these actions (called via startTransition), so we
// don't fight FormData array encoding for skills / responsibilities.
export interface JdWizardPayload {
  readonly title: string;
  readonly roleType: string;
  readonly location: string;
  readonly workMode: string;
  readonly positions: number;
  readonly targetStartDate?: string | undefined;
  readonly baseMinPaise?: number | undefined;
  readonly baseMaxPaise?: number | undefined;
  readonly stipendPaise?: number | undefined;
  readonly variableComponent?: string | undefined;
  readonly targetProgrammes: string[];
  readonly skills: { slug: string; required: boolean }[];
  readonly responsibilities: Record<string, string[]>;
  readonly deliverables: string[];
  readonly supplementaryProseMd?: string | undefined;
  readonly interviewRounds: { round: number; focus: string }[];
  readonly gpFeeAcknowledged: boolean;
}

function withContext(payload: JdWizardPayload) {
  return {
    ...payload,
    recruiterId: DEMO_RECRUITER.recruiterId,
    cycleId: DEMO_RECRUITER.cycleId,
  };
}

export async function saveDraftAction(payload: JdWizardPayload): Promise<JdActionResult> {
  const result = createDraft(withContext(payload));
  if (!result.ok) return { ok: false, failure: result.failure };
  return { ok: true, jdId: result.jd.id, status: result.jd.status };
}

export async function submitJdAction(payload: JdWizardPayload): Promise<JdActionResult> {
  const result = submitForModeration(withContext(payload));
  if (!result.ok) return { ok: false, failure: result.failure };
  return { ok: true, jdId: result.jd.id, status: result.jd.status };
}

/**
 * Discard a draft from the JD list (plan §M). Only `draft`-status JDs are
 * discardable — the module rejects anything that has entered moderation or
 * been published. On failure we bounce back to the list with the reason in a
 * query param (same convention as the close/withdraw actions); on success we
 * revalidate the list so the card disappears.
 */
export async function discardDraftAction(formData: FormData): Promise<void> {
  const jdId = (formData.get('jdId') as string | null)?.trim() ?? '';
  // Ownership guard: a forged cross-branch discard (another branch's draft id)
  // is rejected with 404 before the destructive discard runs.
  await requireOwnedJd(jdId);
  const result = discardDraft(jdId);
  if (!result.ok) {
    redirect(`/recruiter/jds?error=${encodeURIComponent(result.reason ?? 'Discard failed')}`);
  }
  revalidatePath('/recruiter/jds');
  redirect('/recruiter/jds');
}
