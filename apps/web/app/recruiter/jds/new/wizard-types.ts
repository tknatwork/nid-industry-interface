import type { GateFailure } from '@nid/module-jd-posting';

/**
 * Shared wizard ↔ server-action contract (plan §N). Lives in its own module —
 * NOT in the `'use client'` wizard and NOT in a `'use server'` actions file —
 * so both sides import it without crossing a client/server boundary at the
 * value level. Pure types; erased at build.
 *
 * `JdWizardPayload` is the structured object the client wizard serializes from
 * its form state and hands to whichever action it was given. It's a superset of
 * the legacy payload, extended for Round 2 §N with the per-programme
 * compensation split and the optional evaluation task. The jd-posting module's
 * Zod schema is the authoritative validator at the boundary — this type only
 * shapes the call.
 */
export interface JdWizardPayload {
  readonly title: string;
  readonly roleType: string;
  readonly location: string;
  readonly workMode: string;
  readonly positions: number;
  readonly baseMinPaise?: number;
  readonly baseMaxPaise?: number;
  readonly stipendPaise?: number;
  readonly programmeCompensation?: {
    readonly bachelors?: { baseMinPaise?: number; baseMaxPaise?: number; stipendPaise?: number };
    readonly masters?: { baseMinPaise?: number; baseMaxPaise?: number; stipendPaise?: number };
  };
  readonly targetProgrammes: string[];
  readonly skills: { slug: string; required: boolean }[];
  readonly responsibilities: Record<string, string[]>;
  readonly deliverables: string[];
  readonly supplementaryProseMd?: string;
  readonly interviewRounds: { round: number; focus: string }[];
  readonly evaluationTask?: {
    required: boolean;
    title: string;
    briefMd?: string;
    estimatedHours?: number;
    releaseAlignedToCycle: boolean;
  };
  readonly gpFeeAcknowledged: boolean;
}

/** What every wizard action returns: ok, plus an optional gate failure to surface. */
export interface JdWizardActionResult {
  readonly ok: boolean;
  readonly failure?: GateFailure;
}

/** A wizard action: takes the structured payload, persists/validates, reports back. */
export type WizardAction = (payload: JdWizardPayload) => Promise<JdWizardActionResult>;
