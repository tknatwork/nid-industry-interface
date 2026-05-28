'use server';

import { createDraft, submitForModeration, type GateFailure } from '@nid/module-jd-posting';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

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
