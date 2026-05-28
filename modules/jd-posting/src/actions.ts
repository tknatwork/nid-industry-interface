import { checkStipendFloor, type StipendFloorRule } from '@nid/core';
import {
  jdDraftSchema,
  jdModerationSchema,
  type GateFailure,
  type JdDraftInput,
  type JdRecord,
} from './types';
import { strictestFloorPaise, type Programme } from './stipend-floors';
import { engineeringSkillSlugs } from './skills';
import { getJdById, insertJd, listJdsForRecruiter, updateJd } from './store';

export interface CreateDraftResult {
  readonly ok: true;
  readonly jd: JdRecord;
}
export interface ValidationFailure {
  readonly ok: false;
  readonly failure: GateFailure;
}
export type DraftResult = CreateDraftResult | ValidationFailure;
export type SubmitResult = CreateDraftResult | ValidationFailure;

/** Save a draft. Permissive — drafts may be incomplete. */
export function createDraft(input: unknown): DraftResult {
  const parsed = jdDraftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      failure: {
        kind: 'schema',
        message: 'Could not save draft — check the highlighted fields.',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }
  const now = new Date().toISOString();
  const jd = insertJd(buildRecord(parsed.data, 'draft', now));
  return { ok: true, jd };
}

/**
 * Submit a draft for moderation. Runs the pre-publish gate:
 *  1. strict schema completeness
 *  2. deterministic stipend-floor check (@nid/core), scopeCreepMultiplier=1
 *     — bumped to >1 when an engineering skill is bundled (the deterministic
 *       slice of scope-creep detection until the ML analyzer lands).
 */
export function submitForModeration(input: unknown, existingJdId?: string): SubmitResult {
  const parsed = jdModerationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      failure: {
        kind: 'schema',
        message: 'Cannot submit — required fields are missing.',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  const data = parsed.data;
  const floor = runStipendGate(data);
  if (!floor.passes) {
    return { ok: false, failure: floor.failure };
  }

  const now = new Date().toISOString();

  // If submitting an existing draft, freeze it; else create fresh.
  if (existingJdId) {
    const existing = getJdById(existingJdId);
    if (existing && existing.status === 'draft') {
      const updated = updateJd(existingJdId, {
        ...buildRecord(data, 'in-moderation', existing.draftedAt),
        submittedAt: now,
      });
      if (updated) return { ok: true, jd: updated };
    }
  }

  const jd = insertJd({ ...buildRecord(data, 'in-moderation', now), submittedAt: now });
  return { ok: true, jd };
}

export function listForRecruiter(recruiterId: string): readonly JdRecord[] {
  return listJdsForRecruiter(recruiterId);
}

export function getJd(id: string): JdRecord | null {
  return getJdById(id);
}

// ── internals ────────────────────────────────────────────────────────────────

interface GateOk {
  readonly passes: true;
}
interface GateBad {
  readonly passes: false;
  readonly failure: GateFailure;
}

function runStipendGate(data: JdDraftInput): GateOk | GateBad {
  const programmes = data.targetProgrammes as readonly Programme[];
  const baseFloor = strictestFloorPaise(programmes, data.roleType);

  // Deterministic scope-creep signal: an engineering skill bundled into the
  // role bumps the multiplier. The ML analyzer will refine this later.
  const engSlugs = new Set(engineeringSkillSlugs());
  const hasEngineering = data.skills.some((s) => engSlugs.has(s.slug));
  const multiplier = hasEngineering ? 1.4 : 1;

  const rule: StipendFloorRule = {
    cycleId: data.cycleId as StipendFloorRule['cycleId'],
    disciplineIds: [],
    programme: programmes.includes('masters') ? 'masters' : 'bachelors',
    roleType: data.roleType,
    floorPaise: baseFloor,
  };

  const result = checkStipendFloor(
    {
      roleType: data.roleType,
      baseMinPaise: data.baseMinPaise,
      baseMaxPaise: data.baseMaxPaise,
      stipendPaise: data.stipendPaise,
    },
    rule,
    multiplier,
  );

  if (result.passes) return { passes: true };

  const rupees = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;
  const endpoint = result.violatedEndpoint ?? 'single';
  const scopeNote = hasEngineering
    ? ' This role bundles engineering skills, which raises the floor by 40% (scope-creep guard).'
    : '';

  return {
    passes: false,
    failure: {
      kind: 'stipend-floor',
      message:
        `Compensation is below the institution's floor for this role.${scopeNote} ` +
        `Adjusted floor: ${rupees(result.adjustedFloorPaise)}. ` +
        (endpoint === 'high'
          ? 'Your range maximum is below the floor.'
          : endpoint === 'low'
            ? 'Your range minimum is below the floor.'
            : 'Your stipend is below the floor.'),
      floorPaise: result.adjustedFloorPaise,
      violatedEndpoint: endpoint,
    },
  };
}

function buildRecord(
  data: JdDraftInput,
  status: JdRecord['status'],
  draftedAt: string,
): Omit<JdRecord, 'id'> {
  return {
    recruiterId: data.recruiterId,
    cycleId: data.cycleId,
    status,
    title: data.title,
    roleType: data.roleType,
    location: data.location,
    workMode: data.workMode,
    positions: data.positions,
    ...(data.targetStartDate ? { targetStartDate: data.targetStartDate } : {}),
    ...(data.baseMinPaise !== undefined ? { baseMinPaise: data.baseMinPaise } : {}),
    ...(data.baseMaxPaise !== undefined ? { baseMaxPaise: data.baseMaxPaise } : {}),
    ...(data.stipendPaise !== undefined ? { stipendPaise: data.stipendPaise } : {}),
    ...(data.variableComponent ? { variableComponent: data.variableComponent } : {}),
    targetProgrammes: data.targetProgrammes,
    targetDisciplineIds: data.targetDisciplineIds,
    skills: data.skills,
    responsibilities: data.responsibilities,
    deliverables: data.deliverables,
    ...(data.supplementaryProseMd ? { supplementaryProseMd: data.supplementaryProseMd } : {}),
    interviewRounds: data.interviewRounds,
    gpFeeAcknowledged: data.gpFeeAcknowledged,
    draftedAt,
  };
}
