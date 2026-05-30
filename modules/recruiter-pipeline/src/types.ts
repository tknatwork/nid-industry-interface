import { z } from 'zod';

/**
 * The linear recruiter pipeline (Round 4 §B). Strictly forward-only: a JD walks
 * these stages in `STAGE_ORDER` and never goes back. Each stage, once entered,
 * freezes the prior one. The one editability exception (the Before plan staying
 * editable until During begins) is expressed by `isPlanEditable`, not by an
 * extra stage.
 */
export type PipelineStage =
  | 'published'
  | 'shortlisting'
  | 'plan-locked'
  | 'interviewing'
  | 'tallied'
  | 'offer-sequencing'
  | 'letters-out';

/**
 * Canonical stage order. `rank(stage) = STAGE_ORDER.indexOf(stage)` defines the
 * forward-only relation: an advance is permitted iff `rank(to) > rank(from)`.
 */
export const STAGE_ORDER: readonly PipelineStage[] = [
  'published',
  'shortlisting',
  'plan-locked',
  'interviewing',
  'tallied',
  'offer-sequencing',
  'letters-out',
] as const;

/** Stages from which the Before "Lego" plan is still structurally editable. */
const PLAN_EDITABLE_STAGES: ReadonlySet<PipelineStage> = new Set<PipelineStage>([
  'published',
  'shortlisting',
]);

/**
 * Audit actions the pipeline records. The pipeline owns linear progression +
 * the append-only trail; round results live in interview-console. Calling
 * server actions append the domain-specific actions (e.g. `round-recorded`)
 * here so the whole recruiter journey is one ordered, immutable ledger.
 */
export type AuditAction =
  | 'stage-advanced'
  | 'plan-locked'
  | 'plan-override'
  | 'round-recorded'
  | 'round-advanced'
  | 'tally-computed'
  | 'candidates-selected'
  | 'letter-sent'
  | 'interviews-complete';

/**
 * One immutable entry in the per-JD audit trail. Append-only — entries are
 * never mutated or removed. `stageAt` records the stage in force when the
 * action happened (which, for `stage-advanced`, is the stage just entered).
 */
export interface AuditEntry {
  readonly id: string;
  readonly at: string;
  readonly actorRecruiterId: string;
  readonly action: AuditAction;
  readonly stageAt: PipelineStage;
  readonly studentId?: string;
  readonly round?: number;
  readonly summary: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * Per-JD pipeline state. `enteredAt` timestamps each stage the JD has reached
 * (absent ⇒ not yet reached). `audit` is the append-only ledger for this JD.
 */
export interface PipelineState {
  readonly jdId: string;
  readonly stage: PipelineStage;
  readonly enteredAt: Partial<Record<PipelineStage, string>>;
  readonly audit: readonly AuditEntry[];
}

const stageSchema = z.enum([
  'published',
  'shortlisting',
  'plan-locked',
  'interviewing',
  'tallied',
  'offer-sequencing',
  'letters-out',
]);

/**
 * Validates the optional metadata a caller may attach to an audit entry when
 * advancing a stage. Kept loose (`passthrough`) because callers stamp varied,
 * domain-specific context; the structural fields (`studentId`, `round`,
 * `summary`) are validated explicitly on the options object below.
 */
export const advanceOptionsSchema = z
  .object({
    summary: z.string().min(1).optional(),
    studentId: z.string().min(1).optional(),
    round: z.coerce.number().int().min(1).optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .strict();

export const auditAppendSchema = z
  .object({
    actorRecruiterId: z.string().min(1),
    action: z.enum([
      'stage-advanced',
      'plan-locked',
      'plan-override',
      'round-recorded',
      'round-advanced',
      'tally-computed',
      'candidates-selected',
      'letter-sent',
      'interviews-complete',
    ]),
    summary: z.string().min(1),
    studentId: z.string().min(1).optional(),
    round: z.coerce.number().int().min(1).optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .strict();

/** Options accepted by `advanceStage` (all optional — sensible defaults applied). */
export interface AdvanceOptions {
  readonly summary?: string;
  readonly studentId?: string;
  readonly round?: number;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** Payload accepted by `appendAudit`. */
export interface AuditAppendInput {
  readonly actorRecruiterId: string;
  readonly action: AuditAction;
  readonly summary: string;
  readonly studentId?: string;
  readonly round?: number;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** Result shape mirrored from sibling modules (offer-cascade `ActionResult`). */
export interface AdvanceResult {
  readonly ok: boolean;
  readonly stage: PipelineStage;
  readonly advanced: boolean;
  readonly reason?: string;
}

/** `rank(stage)` — its index in the canonical forward order. */
export function rankOf(stage: PipelineStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/** Whether the Before "Lego" plan is still structurally editable at `stage`. */
export function planEditableAt(stage: PipelineStage): boolean {
  return PLAN_EDITABLE_STAGES.has(stage);
}

export { stageSchema };
