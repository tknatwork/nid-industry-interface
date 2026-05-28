import type { CycleId, RecruiterId, TokenId } from './ids.js';

export type RecruiterStatus =
  | 'application-received'
  | 'verification-pending'
  | 'fee-due'
  | 'payment-received'
  | 'approved'
  | 'credentials-issued'
  | 'rejected'
  | 'withdrawn';

/**
 * Recruiter company-level account. Sub-roles (HR Director, Hiring Manager,
 * Interviewer) attach as named contacts, NOT as separate accounts.
 */
export interface Recruiter {
  readonly id: RecruiterId;
  readonly companyName: string;
  readonly sector: string;
  readonly gst: string;
  readonly registrationNumber: string;
  readonly corporateEmail: string;
  readonly websiteUrl?: string;
  readonly category: 'private' | 'mnc' | 'govt' | 'ngo';
  readonly memberSince: Date;
  readonly verified: boolean;
  readonly verifiedBy?: string;
  readonly verifiedAt?: Date;
}

/**
 * Single account, named contact sub-roles. Each carries a contact number
 * visible to the placement cell.
 */
export type RecruiterRole = 'hr-director' | 'hiring-manager' | 'interviewer' | 'api-admin';

export interface RecruiterContact {
  readonly recruiterId: RecruiterId;
  readonly role: RecruiterRole;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
}

/**
 * The pre-login application token (Phase 4.1). Trackable at /track/<token>.
 */
export interface ApplicationToken {
  readonly id: TokenId;
  readonly recruiterId?: RecruiterId; // assigned on approval
  readonly cycleId: CycleId;
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly status: RecruiterStatus;
  readonly statusHistory: ReadonlyArray<{
    readonly status: RecruiterStatus;
    readonly at: Date;
    readonly note?: string;
  }>;
  readonly createdAt: Date;
}

/**
 * Per-cycle engagement record. Tracks the recruiter's participation in a
 * specific cycle.
 */
export interface RecruiterEngagement {
  readonly recruiterId: RecruiterId;
  readonly cycleId: CycleId;
  readonly feePaidAt?: Date;
  readonly status: RecruiterStatus;
  readonly meetingsWithPlacementHead: number;
}

/**
 * Health-score bands (Phase 5.11). Score is transparent to the recruiter
 * (visible at /recruiter/stats) — no black-box opacity.
 */
export type HealthBand = 'excellent' | 'good' | 'watch' | 'restricted' | 'blacklisted';

export interface RecruiterHealth {
  readonly recruiterId: RecruiterId;
  readonly score: number; // computed; bands derived
  readonly band: HealthBand;
  readonly lastComputedAt: Date;
}
