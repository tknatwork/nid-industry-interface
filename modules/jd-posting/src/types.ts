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

  // Compensation (paise)
  baseMinPaise: z.coerce.number().int().min(0).optional(),
  baseMaxPaise: z.coerce.number().int().min(0).optional(),
  stipendPaise: z.coerce.number().int().min(0).optional(),
  variableComponent: z.string().trim().max(200).optional(),

  // Targeting
  targetProgrammes: z.array(programmeSchema).default([]),
  targetDisciplineIds: z.array(z.string()).default([]),

  skills: z.array(skillRefSchema).default([]),
  responsibilities: z.record(responsibilityCategorySchema, z.array(z.string())).default({}),
  deliverables: z.array(z.string()).default([]),
  supplementaryProseMd: z.string().trim().max(8000).optional(),
  interviewRounds: z.array(interviewRoundSchema).default([]),

  gpFeeAcknowledged: z.boolean().default(false),
});

export type JdDraftInput = z.infer<typeof jdDraftSchema>;

/**
 * Strict schema enforced at submit-for-moderation. Everything the draft
 * allowed to be empty becomes required here.
 */
export const jdModerationSchema = jdDraftSchema.extend({
  title: z.string().trim().min(3, 'Title is required'),
  location: z.string().trim().min(2, 'Location is required'),
  positions: z.coerce.number().int().min(1),
  targetProgrammes: z.array(programmeSchema).min(1, 'Select at least one target programme'),
  skills: z.array(skillRefSchema).min(1, 'Add at least one skill'),
  deliverables: z.array(z.string().trim().min(1)).min(1, 'List at least one deliverable'),
  interviewRounds: z.array(interviewRoundSchema).min(1, 'Define at least one interview round'),
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

  readonly targetProgrammes: readonly z.infer<typeof programmeSchema>[];
  readonly targetDisciplineIds: readonly string[];

  readonly skills: readonly z.infer<typeof skillRefSchema>[];
  readonly responsibilities: Readonly<Record<string, readonly string[]>>;
  readonly deliverables: readonly string[];
  readonly supplementaryProseMd?: string;
  readonly interviewRounds: readonly z.infer<typeof interviewRoundSchema>[];
  readonly gpFeeAcknowledged: boolean;

  readonly draftedAt: string;
  readonly submittedAt?: string;
  readonly publishedAt?: string;
}

export interface GateFailure {
  readonly kind: 'schema' | 'stipend-floor';
  readonly message: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly floorPaise?: number;
  readonly violatedEndpoint?: 'low' | 'high' | 'single';
}
