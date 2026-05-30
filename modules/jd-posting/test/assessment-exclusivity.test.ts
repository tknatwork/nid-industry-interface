import { describe, it, expect } from 'vitest';
import { submitForModeration } from '../src/actions';
import { jdModerationSchema } from '../src/types';

/**
 * One unpaid evaluative task per JD: a take-home assignment XOR a live
 * whiteboarding round — never both. Each is a project's worth of work students
 * do without compensation, so the institution caps it at one ("values over
 * money"). Enforced in `jdModerationSchema.superRefine` and mirrored by a
 * client-side submit block in the wizard.
 */

const L = (lakh: number) => Math.round(lakh * 100_000 * 100);

function validBase(over: Record<string, unknown> = {}) {
  return {
    recruiterId: 'NID-2026-A-0001',
    cycleId: 'cycle_spring_2026',
    title: 'Product Designer',
    roleType: 'full-time',
    location: 'Bengaluru',
    workMode: 'hybrid',
    positions: 1,
    targetProgrammes: ['masters'],
    targetDisciplineIds: ['disc_product_design'],
    baseMinPaise: L(8), // clears the ₹6.0L M.Des full-time floor
    baseMaxPaise: L(12),
    skills: [{ slug: 'user-research', required: true }],
    responsibilities: { design: ['Own product flows end to end'] },
    deliverables: ['Ship the onboarding redesign'],
    interviewRounds: [{ round: 1, focus: 'Portfolio review' }],
    gpFeeAcknowledged: true,
    ...over,
  };
}

const takeHome = { required: true, title: 'Redesign an onboarding flow', releaseAlignedToCycle: true };
const whiteboardRound = [{ round: 1, focus: 'Live design exercise', liveExercise: true }];

describe('one unpaid evaluative task per JD (take-home XOR whiteboarding)', () => {
  it('allows a required take-home with NO whiteboarding round', () => {
    expect(jdModerationSchema.safeParse(validBase({ evaluationTask: takeHome })).success).toBe(true);
  });

  it('allows a whiteboarding round with NO take-home', () => {
    expect(jdModerationSchema.safeParse(validBase({ interviewRounds: whiteboardRound })).success).toBe(true);
  });

  it('REJECTS both a take-home AND a whiteboarding round', () => {
    const parsed = jdModerationSchema.safeParse(
      validBase({ evaluationTask: takeHome, interviewRounds: whiteboardRound }),
    );
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(JSON.stringify(parsed.error.flatten().fieldErrors)).toContain('one unpaid evaluative task');
    }
  });

  it('submitForModeration surfaces the conflict as a schema failure (no JD persisted)', () => {
    const r = submitForModeration(
      validBase({ evaluationTask: takeHome, interviewRounds: whiteboardRound }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure.kind).toBe('schema');
      expect(JSON.stringify(r.failure.fieldErrors ?? {})).toContain('one unpaid evaluative task');
    }
  });
});
