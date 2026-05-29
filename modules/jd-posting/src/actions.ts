import { checkStipendFloor, type StipendFloorRule } from '@nid/core';
import {
  jdDraftSchema,
  jdModerationSchema,
  type GateFailure,
  type GateReport,
  type JdDraftInput,
  type JdRecord,
} from './types';
import { strictestFloorPaise, type Programme } from './stipend-floors';
import { engineeringSkillSlugs } from './skills';
import { analyzeScopeForJd } from './scope-analyzer';
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

// ── Admin moderation use cases ───────────────────────────────────────────────

export interface PublishResult {
  readonly ok: boolean;
  readonly jd?: JdRecord;
  readonly reason?: string;
}

/**
 * Publish an in-moderation JD. The admin confirms the discipline mapping here —
 * the institution-mediated translation from recruiter vocabulary to NID
 * disciplines (Phase 4.2). At least one target discipline is required.
 */
export function publishJd(input: {
  jdId: string;
  targetDisciplineIds: readonly string[];
  note?: string;
}): PublishResult {
  const jd = getJdById(input.jdId);
  if (!jd) return { ok: false, reason: 'JD not found' };
  if (jd.status !== 'in-moderation') {
    return { ok: false, reason: `Cannot publish a JD in '${jd.status}' status` };
  }
  if (input.targetDisciplineIds.length === 0) {
    return { ok: false, reason: 'Confirm at least one target discipline before publishing' };
  }
  const updated = updateJd(input.jdId, {
    status: 'published',
    targetDisciplineIds: [...input.targetDisciplineIds],
    publishedAt: new Date().toISOString(),
    ...(input.note ? { moderationNote: input.note } : {}),
  });
  return updated ? { ok: true, jd: updated } : { ok: false, reason: 'Update failed' };
}

/**
 * Hold a JD for clarification — moves it back to draft so the recruiter can
 * revise and resubmit. A note (the clarification request) is required.
 */
export function holdJd(input: { jdId: string; note: string }): PublishResult {
  const jd = getJdById(input.jdId);
  if (!jd) return { ok: false, reason: 'JD not found' };
  if (jd.status !== 'in-moderation') {
    return { ok: false, reason: `Cannot hold a JD in '${jd.status}' status` };
  }
  if (!input.note.trim()) {
    return { ok: false, reason: 'A clarification note is required' };
  }
  const updated = updateJd(input.jdId, {
    status: 'draft',
    moderationNote: input.note.trim(),
    heldAt: new Date().toISOString(),
  });
  return updated ? { ok: true, jd: updated } : { ok: false, reason: 'Update failed' };
}

/**
 * Close a published JD (Phase 4.16). A collective justification for the
 * not-selected students is MANDATORY — the close is blocked without it. This
 * is NID's professional-communication baseline, codified in product.
 */
export function closeJd(input: { jdId: string; collectiveMessage: string }): PublishResult {
  const jd = getJdById(input.jdId);
  if (!jd) return { ok: false, reason: 'JD not found' };
  if (jd.status !== 'published') {
    return { ok: false, reason: `Cannot close a JD in '${jd.status}' status` };
  }
  if (!input.collectiveMessage.trim()) {
    return { ok: false, reason: 'A collective justification is required to close the JD.' };
  }
  const updated = updateJd(input.jdId, {
    status: 'closed',
    closeMessageMd: input.collectiveMessage.trim(),
    closedAt: new Date().toISOString(),
  });
  return updated ? { ok: true, jd: updated } : { ok: false, reason: 'Update failed' };
}

/**
 * Withdraw a JD (Phase 5.12). Treated as a commitment break — a reason category
 * + detail are required. Force-majeure is accepted without score impact at
 * moderation; other reasons carry a health-score signal (handled admin-side).
 */
export function withdrawJd(input: { jdId: string; category: string; reason: string }): PublishResult {
  const jd = getJdById(input.jdId);
  if (!jd) return { ok: false, reason: 'JD not found' };
  if (jd.status !== 'published' && jd.status !== 'in-moderation') {
    return { ok: false, reason: `Cannot withdraw a JD in '${jd.status}' status` };
  }
  if (!input.reason.trim()) return { ok: false, reason: 'A reason is required to withdraw.' };
  const updated = updateJd(input.jdId, {
    status: 'withdrawn',
    withdrawnCategory: input.category,
    withdrawnReason: input.reason.trim(),
    withdrawnAt: new Date().toISOString(),
  });
  return updated ? { ok: true, jd: updated } : { ok: false, reason: 'Update failed' };
}

/**
 * Read-only gate report so the admin sees WHY a JD passed the stipend gate
 * (transparency). Re-runs the same deterministic check the submit gate used.
 * The multiplier here is the legacy 1.0/1.4 engineering heuristic.
 */
export function gateReportFor(jd: JdRecord): GateReport {
  const engSlugs = new Set(engineeringSkillSlugs());
  const hasEngineering = jd.skills.some((s) => engSlugs.has(s.slug));
  return buildGateReport(jd, hasEngineering ? 1.4 : 1, hasEngineering);
}

/**
 * Async gate report that consults the ML scope-creep analyzer (Python worker)
 * for a graduated multiplier + rationale (Phase 6.11a). Falls back to the
 * deterministic heuristic when the worker is unreachable, so this never blocks
 * the moderation view. Used by the admin JD review page.
 */
export async function gateReportForAsync(jd: JdRecord): Promise<GateReport> {
  const analysis = await analyzeScopeForJd(jd);
  const base = buildGateReport(jd, analysis.scopeMultiplier, analysis.scopeCreepDetected);
  return {
    ...base,
    scopeRationale: analysis.rationale,
    scopeSource: analysis.source,
    flaggedSkillSlugs: analysis.flaggedSkillSlugs,
  };
}

function buildGateReport(jd: JdRecord, multiplier: number, hasEngineering: boolean): GateReport {
  const programmes = jd.targetProgrammes as readonly Programme[];
  const cycleFloor = strictestFloorPaise(programmes, jd.roleType);

  const rule: StipendFloorRule = {
    cycleId: jd.cycleId as StipendFloorRule['cycleId'],
    disciplineIds: [],
    programme: programmes.includes('masters') ? 'masters' : 'bachelors',
    roleType: jd.roleType,
    floorPaise: cycleFloor,
  };
  const result = checkStipendFloor(
    {
      roleType: jd.roleType,
      baseMinPaise: jd.baseMinPaise,
      baseMaxPaise: jd.baseMaxPaise,
      stipendPaise: jd.stipendPaise,
    },
    rule,
    multiplier,
  );

  return {
    stipendFloorPasses: result.passes,
    cycleFloorPaise: cycleFloor,
    adjustedFloorPaise: result.adjustedFloorPaise,
    scopeCreepMultiplier: multiplier,
    hasEngineeringSkills: hasEngineering,
    ...(jd.baseMinPaise !== undefined ? { offeredLowPaise: jd.baseMinPaise } : {}),
    ...(jd.baseMaxPaise !== undefined ? { offeredHighPaise: jd.baseMaxPaise } : {}),
    ...(jd.stipendPaise !== undefined ? { offeredStipendPaise: jd.stipendPaise } : {}),
  };
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
