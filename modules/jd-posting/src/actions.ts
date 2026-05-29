import {
  checkStipendFloor,
  type StipendFloorRule,
  type StipendFloorInput,
  type StipendFloorCheck,
} from '@nid/core';
import {
  jdDraftSchema,
  jdModerationSchema,
  type GateFailure,
  type GateReport,
  type JdDraftInput,
  type JdRecord,
  type ProgrammeComp,
} from './types';
import { floorPaiseFor, type Programme } from './stipend-floors';
import { engineeringSkillSlugs } from './skills';
import { analyzeScopeForJd } from './scope-analyzer';
import { deleteJd, getJdById, insertJd, listJdsForRecruiter, replaceJd, updateJd } from './store';

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

export interface UpdateDraftResult {
  readonly ok: true;
  readonly jd: JdRecord;
}
export interface ActionFailure {
  readonly ok: false;
  readonly reason: string;
}
export type EditDraftResult = UpdateDraftResult | ValidationFailure | ActionFailure;
export type DiscardDraftResult = { readonly ok: true } | ActionFailure;

/**
 * Update an existing draft in place (Round 2 §M — "Edit draft"). Permissive,
 * like createDraft: drafts may still be incomplete. Only records currently in
 * `draft` status can be edited — published/in-moderation JDs are immutable
 * (Phase 4.2), so this refuses to touch them. The record's original
 * `draftedAt` is preserved.
 */
export function updateDraft(jdId: string, input: unknown): EditDraftResult {
  const existing = getJdById(jdId);
  if (!existing) return { ok: false, reason: 'Draft not found' };
  if (existing.status !== 'draft') {
    return { ok: false, reason: `Cannot edit a JD in '${existing.status}' status` };
  }

  const parsed = jdDraftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      failure: {
        kind: 'schema',
        message: 'Could not save changes — check the highlighted fields.',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  // Rebuild the whole record from the validated input, then re-apply the
  // immutable identity fields so a caller can't move the draft to another
  // recruiter/cycle through this path. replaceJd (not updateJd) so optional
  // fields the recruiter cleared don't linger via a shallow merge.
  const rebuilt = buildRecord(parsed.data, 'draft', existing.draftedAt);
  const updated = replaceJd(jdId, {
    ...rebuilt,
    recruiterId: existing.recruiterId,
    cycleId: existing.cycleId,
    status: 'draft',
  });
  return updated ? { ok: true, jd: updated } : { ok: false, reason: 'Update failed' };
}

/**
 * Discard a draft (Round 2 §M — "Discard draft"). Removes the draft record
 * entirely. Only `draft` records can be discarded; anything that has entered
 * moderation or been published is immutable and must follow the
 * withdraw/close paths instead.
 */
export function discardDraft(jdId: string): DiscardDraftResult {
  const existing = getJdById(jdId);
  if (!existing) return { ok: false, reason: 'Draft not found' };
  if (existing.status !== 'draft') {
    return { ok: false, reason: `Cannot discard a JD in '${existing.status}' status` };
  }
  return deleteJd(jdId) ? { ok: true } : { ok: false, reason: 'Discard failed' };
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
  const evals = evaluateProgrammeFloors(jd, multiplier);
  const split = evals.length > 1;

  // The binding programme drives the headline scalars: the first failing one,
  // else the one with the strictest (highest) adjusted floor — M.Des when both
  // pass. `perProgramme` carries the full per-programme breakdown so the admin
  // transparency view reflects BOTH programmes (Round 2 §N).
  const binding =
    evals.find((e) => !e.result.passes) ??
    evals.reduce((a, b) => (b.result.adjustedFloorPaise > a.result.adjustedFloorPaise ? b : a));

  const perProgramme = split
    ? evals.map((e) => {
        const c = jd.programmeCompensation?.[e.programme];
        return {
          programme: e.programme,
          passes: e.result.passes,
          cycleFloorPaise: e.cycleFloorPaise,
          adjustedFloorPaise: e.result.adjustedFloorPaise,
          ...(c?.baseMinPaise !== undefined ? { offeredLowPaise: c.baseMinPaise } : {}),
          ...(c?.baseMaxPaise !== undefined ? { offeredHighPaise: c.baseMaxPaise } : {}),
          ...(c?.stipendPaise !== undefined ? { offeredStipendPaise: c.stipendPaise } : {}),
        };
      })
    : undefined;

  // Offered scalars come from the binding programme's own comp slice in split
  // mode, else the top-level fields.
  const bindingComp = split ? jd.programmeCompensation?.[binding.programme] : undefined;
  const offeredLow = bindingComp ? bindingComp.baseMinPaise : jd.baseMinPaise;
  const offeredHigh = bindingComp ? bindingComp.baseMaxPaise : jd.baseMaxPaise;
  const offeredStipend = bindingComp ? bindingComp.stipendPaise : jd.stipendPaise;

  return {
    stipendFloorPasses: evals.every((e) => e.result.passes),
    cycleFloorPaise: binding.cycleFloorPaise,
    adjustedFloorPaise: binding.result.adjustedFloorPaise,
    scopeCreepMultiplier: multiplier,
    hasEngineeringSkills: hasEngineering,
    ...(offeredLow !== undefined ? { offeredLowPaise: offeredLow } : {}),
    ...(offeredHigh !== undefined ? { offeredHighPaise: offeredHigh } : {}),
    ...(offeredStipend !== undefined ? { offeredStipendPaise: offeredStipend } : {}),
    ...(perProgramme ? { perProgramme } : {}),
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

interface ProgrammeFloorEval {
  readonly programme: Programme;
  readonly cycleFloorPaise: number;
  readonly result: StipendFloorCheck;
}

/** Structural shape both `JdDraftInput` and `JdRecord` satisfy. */
interface FloorSource {
  readonly roleType: JdDraftInput['roleType'];
  readonly cycleId: string;
  readonly targetProgrammes: readonly Programme[];
  readonly baseMinPaise?: number | undefined;
  readonly baseMaxPaise?: number | undefined;
  readonly stipendPaise?: number | undefined;
  readonly programmeCompensation?:
    | { readonly bachelors?: ProgrammeComp | undefined; readonly masters?: ProgrammeComp | undefined }
    | undefined;
}

/**
 * Evaluate each targeted programme against ITS OWN floor (Round 2 §N — "each
 * gated against its own floor").
 *
 * In split (both-programmes) mode the per-programme `programmeCompensation`
 * slice is authoritative — B.Des is checked against the B.Des floor and M.Des
 * against the M.Des floor. Single-programme JDs use the top-level comp fields
 * against that one programme's floor. The moderation schema separately enforces
 * M.Des ≥ B.Des, so the floor check (lower bound) and the schema (ordering)
 * together pin the full invariant.
 *
 * This is the single source of truth the server gate (`runStipendGate`), the
 * admin transparency report (`buildGateReport`), AND the client predictor
 * mirror — so they can no longer disagree.
 */
function evaluateProgrammeFloors(src: FloorSource, multiplier: number): ProgrammeFloorEval[] {
  const programmes: readonly Programme[] =
    src.targetProgrammes.length > 0 ? src.targetProgrammes : ['masters'];
  const split =
    programmes.includes('bachelors') &&
    programmes.includes('masters') &&
    src.programmeCompensation !== undefined;

  return programmes.map((programme) => {
    const cycleFloorPaise = floorPaiseFor(programme, src.roleType);
    const slice = split ? src.programmeCompensation?.[programme] : undefined;
    const input: StipendFloorInput =
      split && slice
        ? {
            roleType: src.roleType,
            baseMinPaise: slice.baseMinPaise,
            baseMaxPaise: slice.baseMaxPaise,
            stipendPaise: slice.stipendPaise,
          }
        : {
            roleType: src.roleType,
            baseMinPaise: src.baseMinPaise,
            baseMaxPaise: src.baseMaxPaise,
            stipendPaise: src.stipendPaise,
          };
    const rule: StipendFloorRule = {
      cycleId: src.cycleId as StipendFloorRule['cycleId'],
      disciplineIds: [],
      programme,
      roleType: src.roleType,
      floorPaise: cycleFloorPaise,
    };
    return { programme, cycleFloorPaise, result: checkStipendFloor(input, rule, multiplier) };
  });
}

function runStipendGate(data: JdDraftInput): GateOk | GateBad {
  // Deterministic scope-creep signal: an engineering skill bundled into the
  // role bumps the multiplier. The ML analyzer will refine this later.
  const engSlugs = new Set(engineeringSkillSlugs());
  const hasEngineering = data.skills.some((s) => engSlugs.has(s.slug));
  const multiplier = hasEngineering ? 1.4 : 1;

  // Gate EVERY targeted programme against its own floor — fail if ANY is below.
  const evals = evaluateProgrammeFloors(data, multiplier);
  const failing = evals.find((e) => !e.result.passes);
  if (!failing) return { passes: true };

  const split = evals.length > 1;
  const rupees = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;
  const endpoint = failing.result.violatedEndpoint ?? 'single';
  const prog = failing.programme === 'masters' ? 'M.Des' : 'B.Des';
  const tag = split ? `${prog} ` : '';
  const scopeNote = hasEngineering
    ? ' This role bundles engineering skills, which raises the floor by 40% (scope-creep guard).'
    : '';

  return {
    passes: false,
    failure: {
      kind: 'stipend-floor',
      message:
        `${split ? `${prog} compensation` : 'Compensation'} is below the institution's floor for this role.${scopeNote} ` +
        `Adjusted ${tag}floor: ${rupees(failing.result.adjustedFloorPaise)}. ` +
        (endpoint === 'high'
          ? `Your ${tag}range maximum is below the floor.`
          : endpoint === 'low'
            ? `Your ${tag}range minimum is below the floor.`
            : `Your ${tag}stipend is below the floor.`),
      floorPaise: failing.result.adjustedFloorPaise,
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
    ...(data.programmeCompensation
      ? {
          programmeCompensation: {
            ...(data.programmeCompensation.bachelors !== undefined ? { bachelors: data.programmeCompensation.bachelors } : {}),
            ...(data.programmeCompensation.masters !== undefined ? { masters: data.programmeCompensation.masters } : {}),
          },
        }
      : {}),
    targetProgrammes: data.targetProgrammes,
    targetDisciplineIds: data.targetDisciplineIds,
    skills: data.skills,
    responsibilities: data.responsibilities,
    deliverables: data.deliverables,
    ...(data.supplementaryProseMd ? { supplementaryProseMd: data.supplementaryProseMd } : {}),
    interviewRounds: data.interviewRounds,
    ...(data.evaluationTask ? { evaluationTask: data.evaluationTask } : {}),
    gpFeeAcknowledged: data.gpFeeAcknowledged,
    draftedAt,
  };
}
