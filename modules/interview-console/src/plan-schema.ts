import { z } from 'zod';

/**
 * Zod schema for an interview-plan draft at the action boundary (Round 4 §C
 * Before). The Lego-timeline client component posts a fully serializable draft
 * (duration + rounds + slots + assignments); the server action validates it
 * with this schema before calling `writePlan`. Structural writes are refused by
 * the store once the plan is `locked`, so this schema describes the *editable*
 * shape only — `locked`/`lockedAt`/`updatedAt` are owned by the store.
 */

const planRoundSchema = z.object({
  round: z.coerce.number().int().min(1),
  label: z.string().min(1),
});

const planSlotSchema = z.object({
  slotId: z.string().min(1),
  startTime: z.string().min(1),
  durationMin: z.coerce.number().int().min(1),
});

const planAssignmentSchema = z.object({
  studentId: z.string().min(1),
  slotId: z.string().min(1),
  round: z.coerce.number().int().min(1),
  interviewerIds: z.array(z.string().min(1)).default([]),
});

export const planDraftSchema = z.object({
  jdId: z.string().min(1),
  durationMin: z.coerce.number().int().min(1),
  rounds: z.array(planRoundSchema).min(1),
  slots: z.array(planSlotSchema).default([]),
  assignments: z.array(planAssignmentSchema).default([]),
});

/** A validated plan draft — the editable surface of an InterviewPlan. */
export type PlanDraft = z.infer<typeof planDraftSchema>;

/** Schema for a single post-lock assignment override (one student cell). */
export const planOverrideSchema = z.object({
  jdId: z.string().min(1),
  studentId: z.string().min(1),
  slotId: z.string().min(1),
  round: z.coerce.number().int().min(1),
  interviewerIds: z.array(z.string().min(1)).default([]),
});

export type PlanOverride = z.infer<typeof planOverrideSchema>;
