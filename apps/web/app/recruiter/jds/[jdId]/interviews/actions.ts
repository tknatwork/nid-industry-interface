'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  setTransportMode,
  recordRoundOutcome,
  setCandidateDecision,
  setInterviewsComplete,
  type TransportMode,
  type RoundOutcome,
  type CandidateDecision,
  type RoundOutcomeInput,
} from '@nid/module-interview-console';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? '';
}

function refresh(jdId: string): void {
  revalidatePath(`/recruiter/jds/${jdId}/interviews`);
  redirect(`/recruiter/jds/${jdId}/interviews`);
}

export async function setTransportAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (jdId) await requireOwnedJd(jdId);
  const mode = str(formData, 'mode');
  if (mode === 'live' || mode === 'periodic' || mode === 'manual') {
    setTransportMode(DEMO_RECRUITER.recruiterId, mode as TransportMode);
  }
  refresh(jdId);
}

/**
 * Record a per-round outcome from the During console (§R). Captures an optional
 * evaluation score (0–10) + note, then persists the round via
 * `recordRoundOutcome`. The store flips the decision to `rejected` on a reject;
 * an `advance` additionally marks the candidate `selected` so they land in the
 * After-phase offer pool. `hold` leaves the decision untouched.
 */
export async function recordOutcomeAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  const studentId = str(formData, 'studentId');
  const outcomeRaw = str(formData, 'outcome');
  const roundRaw = Number(str(formData, 'round'));

  const isOutcome = outcomeRaw === 'advance' || outcomeRaw === 'hold' || outcomeRaw === 'reject';
  if (!jdId || !studentId || !isOutcome || !Number.isInteger(roundRaw) || roundRaw < 1) {
    refresh(jdId);
    return;
  }
  await requireOwnedJd(jdId);
  const outcome = outcomeRaw as RoundOutcome;

  const scoreRaw = str(formData, 'score');
  const scoreNum = scoreRaw === '' ? NaN : Number(scoreRaw);
  const hasScore = Number.isFinite(scoreNum) && scoreNum >= 0 && scoreNum <= 10;
  const note = str(formData, 'note');

  const input: RoundOutcomeInput = {
    round: roundRaw,
    outcome,
    ...(hasScore ? { score: scoreNum } : {}),
    ...(note ? { note } : {}),
  };
  recordRoundOutcome(jdId, studentId, input);

  // Advance promotes to the selected pool; reject is handled inside the store.
  if (outcome === 'advance') {
    setCandidateDecision(jdId, studentId, 'selected');
  }

  refresh(jdId);
}

/** After-phase: explicitly move a candidate between selected / rejected / pending. */
export async function setDecisionAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (jdId) await requireOwnedJd(jdId);
  const studentId = str(formData, 'studentId');
  const decisionRaw = str(formData, 'decision');
  const isDecision = decisionRaw === 'selected' || decisionRaw === 'rejected' || decisionRaw === 'pending';
  if (jdId && studentId && isDecision) {
    setCandidateDecision(jdId, studentId, decisionRaw as CandidateDecision);
  }
  refresh(jdId);
}

/** After-phase "Done & Dusted": flip the per-JD interviews-complete flag (unlocks Offers). */
export async function markCompleteAction(formData: FormData): Promise<void> {
  const jdId = str(formData, 'jdId');
  if (jdId) {
    await requireOwnedJd(jdId);
    setInterviewsComplete(jdId, true);
  }
  refresh(jdId);
}
