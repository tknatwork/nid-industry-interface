import { z } from 'zod';

/**
 * Zod schemas for JD posting. Built on the @nid/core Jd entity shape but
 * scoped to what the form collects. Compensation in paise (integers).
 */

export const roleTypeSchema = z.enum(['full-time', 'vacation-internship', 'during-course-internship']);
export const workModeSchema = z.enum(['onsite', 'remote', 'hybrid']);
export const jdStatusSchema = z.enum(['draft', 'in-moderation', 'published', 'closed', 'withdrawn']);
export const programmeSchema = z.enum(['bachelors', 'masters']);

export const responsibilityCategorySchema = z.enum([
  'discovery',
  'definition',
  'design',
  'delivery',
  'ops',
]);

export const skillRefSchema = z.object({
  slug: z.string().min(1),
  required: z.boolean(),
});

export const interviewRoundSchema = z.object({
  round: z.number().int().min(1).max(10),
  focus: z.string().trim().min(2).max(200),
});

/**
 * Per-programme compensation (Round 2 §N). When a JD targets BOTH B.Des
 * (bachelors) and M.Des (masters), the recruiter captures compensation
 * separately for each programme — the floor matrix differs, and the demo
 * surfaces a salary predictor per programme. Compensation in paise.
 *
 * Shape mirrors the top-level comp fields: a base range (min/max) for
 * full-time, a single stipend for internships. Drafts may leave any of these
 * empty; the moderation schema (below) enforces M.Des ≥ B.Des.
 */
export const programmeCompSchema = z.object({
  baseMinPaise: z.coerce.number().int().min(0).optional(),
  baseMaxPaise: z.coerce.number().int().min(0).optional(),
  stipendPaise: z.coerce.number().int().min(0).optional(),
});
export type ProgrammeComp = z.infer<typeof programmeCompSchema>;

/**
 * Optional evaluation task (Round 2 §N). A creation-time provision to require
 * a take-home / evaluation task from candidates. When `required` is true a
 * `title` is expected (enforced at moderation). `releaseAlignedToCycle` is the
 * "lock" that aligns task release to the cycle's institute dates so companies
 * can't stall the placement timeline — default true.
 */
export const evaluationTaskSchema = z.object({
  required: z.boolean().default(false),
  title: z.string().trim().max(160).default(''),
  briefMd: z.string().trim().max(8000).optional(),
  estimatedHours: z.coerce.number().int().min(1).max(80).optional(),
  releaseAlignedToCycle: z.boolean().default(true),
});
export type EvaluationTask = z.infer<typeof evaluationTaskSchema>;

/**
 * The draft schema is permissive — drafts can be incomplete. The
 * moderation schema (below) is strict.
 */
export const jdDraftSchema = z.object({
  recruiterId: z.string().min(1),
  cycleId: z.string().min(1),
  title: z.string().trim().max(160).default(''),
  roleType: roleTypeSchema,
  location: z.string().trim().max(120).default(''),
  workMode: workModeSchema.default('onsite'),
  positions: z.coerce.number().int().min(1).max(500).default(1),
  targetStartDate: z.string().optional(),

  // Compensation (paise). The top-level fields stay the single source of truth
  // for single-programme JDs and the gate. When BOTH programmes are targeted,
  // `programmeCompensation` carries the per-programme split (Round 2 §N).
  baseMinPaise: z.coerce.number().int().min(0).optional(),
  baseMaxPaise: z.coerce.number().int().min(0).optional(),
  stipendPaise: z.coerce.number().int().min(0).optional(),
  variableComponent: z.string().trim().max(200).optional(),
  programmeCompensation: z
    .object({
      bachelors: programmeCompSchema.optional(),
      masters: programmeCompSchema.optional(),
    })
    .optional(),

  // Targeting
  targetProgrammes: z.array(programmeSchema).default([]),
  targetDisciplineIds: z.array(z.string()).default([]),

  skills: z.array(skillRefSchema).default([]),
  responsibilities: z.record(responsibilityCategorySchema, z.array(z.string())).default({}),
  deliverables: z.array(z.string()).default([]),
  supplementaryProseMd: z.string().trim().max(8000).optional(),
  interviewRounds: z.array(interviewRoundSchema).default([]),

  evaluationTask: evaluationTaskSchema.optional(),

  gpFeeAcknowledged: z.boolean().default(false),
});

export type JdDraftInput = z.infer<typeof jdDraftSchema>;

/**
 * Strict schema enforced at submit-for-moderation. Everything the draft
 * allowed to be empty becomes required here.
 */
export const jdModerationSchema = jdDraftSchema
  .extend({
    title: z.string().trim().min(3, 'Title is required'),
    location: z.string().trim().min(2, 'Location is required'),
    positions: z.coerce.number().int().min(1),
    targetProgrammes: z.array(programmeSchema).min(1, 'Select at least one target programme'),
    skills: z.array(skillRefSchema).min(1, 'Add at least one skill'),
    deliverables: z.array(z.string().trim().min(1)).min(1, 'List at least one deliverable'),
    interviewRounds: z.array(interviewRoundSchema).min(1, 'Define at least one interview round'),
  })
  .superRefine((data, ctx) => {
    // If an evaluation task is required, it must carry a title.
    if (data.evaluationTask?.required && data.evaluationTask.title.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evaluationTask', 'title'],
        message: 'Name the evaluation task, or turn the requirement off.',
      });
    }

    // Per-programme compensation rules apply only when BOTH programmes are
    // targeted (Round 2 §N). Single-programme JDs use the top-level comp fields.
    const both =
      data.targetProgrammes.includes('bachelors') && data.targetProgrammes.includes('masters');
    if (!both) return;

    const comp = data.programmeCompensation;
    const bachelors = comp?.bachelors;
    const masters = comp?.masters;
    if (!bachelors || !masters) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['programmeCompensation'],
        message: 'Targeting both B.Des and M.Des requires compensation for each programme.',
      });
      return;
    }

    if (data.roleType === 'full-time') {
      const bMin = bachelors.baseMinPaise;
      const bMax = bachelors.baseMaxPaise;
      const mMin = masters.baseMinPaise;
      const mMax = masters.baseMaxPaise;
      if (bMin === undefined || bMax === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['programmeCompensation', 'bachelors'],
          message: 'Enter a base salary range for B.Des.',
        });
      }
      if (mMin === undefined || mMax === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['programmeCompensation', 'masters'],
          message: 'Enter a base salary range for M.Des.',
        });
      }
      // M.Des must be at least B.Des at BOTH endpoints — a meaningful ≥, not
      // just a single-point comparison.
      if (
        bMin !== undefined &&
        mMin !== undefined &&
        bMax !== undefined &&
        mMax !== undefined &&
        (mMin < bMin || mMax < bMax)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['programmeCompensation', 'masters'],
          message: 'M.Des compensation must be at least the B.Des compensation at both ends.',
        });
      }
    } else {
      const bStipend = bachelors.stipendPaise;
      const mStipend = masters.stipendPaise;
      if (bStipend === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['programmeCompensation', 'bachelors'],
          message: 'Enter a stipend for B.Des.',
        });
      }
      if (mStipend === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['programmeCompensation', 'masters'],
          message: 'Enter a stipend for M.Des.',
        });
      }
      if (bStipend !== undefined && mStipend !== undefined && mStipend < bStipend) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['programmeCompensation', 'masters'],
          message: 'M.Des stipend must be at least the B.Des stipend.',
        });
      }
    }
  });

export interface JdRecord {
  readonly id: string;
  readonly recruiterId: string;
  readonly cycleId: string;
  readonly replacesJdId?: string;
  readonly status: z.infer<typeof jdStatusSchema>;

  readonly title: string;
  readonly roleType: z.infer<typeof roleTypeSchema>;
  readonly location: string;
  readonly workMode: z.infer<typeof workModeSchema>;
  readonly positions: number;
  readonly targetStartDate?: string;

  readonly baseMinPaise?: number;
  readonly baseMaxPaise?: number;
  readonly stipendPaise?: number;
  readonly variableComponent?: string;
  // Per-programme compensation split, present when both programmes are
  // targeted (Round 2 §N). Single-programme JDs leave this undefined.
  readonly programmeCompensation?: {
    readonly bachelors?: ProgrammeComp;
    readonly masters?: ProgrammeComp;
  };

  readonly targetProgrammes: readonly z.infer<typeof programmeSchema>[];
  readonly targetDisciplineIds: readonly string[];

  readonly skills: readonly z.infer<typeof skillRefSchema>[];
  readonly responsibilities: Readonly<Record<string, readonly string[]>>;
  readonly deliverables: readonly string[];
  readonly supplementaryProseMd?: string;
  readonly interviewRounds: readonly z.infer<typeof interviewRoundSchema>[];
  readonly evaluationTask?: EvaluationTask;
  readonly gpFeeAcknowledged: boolean;

  readonly draftedAt: string;
  readonly submittedAt?: string;
  readonly publishedAt?: string;
  readonly moderationNote?: string;
  readonly heldAt?: string;
  // Close (4.16 rejection-with-collective-justification) + withdraw (5.12)
  readonly closeMessageMd?: string;
  readonly closedAt?: string;
  readonly withdrawnCategory?: string;
  readonly withdrawnReason?: string;
  readonly withdrawnAt?: string;
}

export interface GateFailure {
  readonly kind: 'schema' | 'stipend-floor';
  readonly message: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly floorPaise?: number;
  readonly violatedEndpoint?: 'low' | 'high' | 'single';
}

/** Read-only gate report for admin transparency during moderation. */
export interface GateReport {
  readonly stipendFloorPasses: boolean;
  readonly cycleFloorPaise: number;
  readonly adjustedFloorPaise: number;
  readonly scopeCreepMultiplier: number;
  readonly hasEngineeringSkills: boolean;
  readonly offeredLowPaise?: number;
  readonly offeredHighPaise?: number;
  readonly offeredStipendPaise?: number;
  // Populated when the ML analyzer ran (gateReportForAsync). The sync
  // gateReportFor leaves these undefined and uses the deterministic heuristic.
  readonly scopeRationale?: string;
  readonly scopeSource?: 'analyzer' | 'fallback';
  readonly flaggedSkillSlugs?: readonly string[];
  // Per-programme floor breakdown (Round 2 §N — "each gated against its own
  // floor"). Present only when a JD targets BOTH programmes with a
  // per-programme compensation split; each programme is checked against ITS
  // OWN floor. Single-programme JDs leave this undefined and the scalar fields
  // above describe the one programme.
  readonly perProgramme?: ReadonlyArray<{
    readonly programme: z.infer<typeof programmeSchema>;
    readonly passes: boolean;
    readonly cycleFloorPaise: number;
    readonly adjustedFloorPaise: number;
    readonly offeredLowPaise?: number;
    readonly offeredHighPaise?: number;
    readonly offeredStipendPaise?: number;
  }>;
}
