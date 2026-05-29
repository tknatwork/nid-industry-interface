import { z } from 'zod';
import type { HealthBand, HealthEvent } from '@nid/core';

/**
 * Admin-accountability types (Phase 5.7–5.11). This module persists the
 * accountability *events* + adjudication state and composes the pure
 * health-score math from @nid/core into a live score + band per company.
 */

export interface HealthEventRecord {
  readonly recruiterId: string;
  readonly companyName: string;
  readonly event: HealthEvent;
  readonly at: string;
  readonly note?: string;
}

export interface RecruiterScore {
  readonly recruiterId: string;
  readonly companyName: string;
  readonly score: number;
  readonly band: HealthBand;
  readonly eventCount: number;
  readonly blacklisted: boolean;
}

export type RedressalCategory =
  | 'stipend-not-paid'
  | 'scope-creep-mid-internship'
  | 'harassment'
  | 'jd-term-breach'
  | 'contract-dishonoured';

export type RedressalStatus = 'open' | 'dismissed' | 'warning' | 'upheld-score' | 'upheld-revoke';

export interface RedressalCase {
  readonly id: string;
  readonly recruiterId: string;
  readonly companyName: string;
  /** Anonymisable label — never the raw student name in the admin list. */
  readonly studentLabel: string;
  readonly category: RedressalCategory;
  readonly description: string;
  readonly isInternship: boolean; // stricter timeline for internships (Phase 5.7)
  readonly status: RedressalStatus;
  readonly filedAt: string;
  readonly decidedAt?: string;
  readonly decisionNote?: string;
}

export interface BlacklistEntry {
  readonly recruiterId: string;
  readonly companyName: string;
  readonly reason: string;
  readonly cooldownMonths: number;
  readonly addedAt: string;
  readonly lifted: boolean;
  readonly liftedReason?: string;
  readonly liftedAt?: string;
}

export type PaymentKind = 'refund' | 'dispute';
export type PaymentStatus = 'open' | 'approved' | 'denied';

export interface PaymentCase {
  readonly id: string;
  readonly recruiterId: string;
  readonly companyName: string;
  readonly kind: PaymentKind;
  readonly category: string;
  readonly amountPaise?: number;
  readonly status: PaymentStatus;
  readonly filedAt: string;
  readonly decidedAt?: string;
  readonly decisionNote?: string;
}

// ── Decision input schemas (parsed at the action boundary) ───────────────────

export const redressalDecisionSchema = z.object({
  caseId: z.string().min(1),
  decision: z.enum(['dismissed', 'warning', 'upheld-score', 'upheld-revoke']),
  note: z.string().trim().max(500).optional(),
});

export const blacklistAddSchema = z.object({
  recruiterId: z.string().min(1),
  reason: z.string().trim().min(3, 'A reason is required'),
  cooldownMonths: z.coerce.number().int().min(1).max(60),
});

export const blacklistLiftSchema = z.object({
  recruiterId: z.string().min(1),
  reason: z.string().trim().min(3, 'A reason is required'),
});

export const paymentDecisionSchema = z.object({
  caseId: z.string().min(1),
  decision: z.enum(['approved', 'denied']),
  note: z.string().trim().max(500).optional(),
});

export interface ActionResult {
  readonly ok: boolean;
  readonly reason?: string;
}

// ── Student conduct (Phase 5.10) ─────────────────────────────────────────────

export type ConductKind = 'no-show' | 'ghost-after-acceptance';
export type ConductStatus = 'open' | 'dismissed' | 'warning' | 'visibility-reduced' | 'ineligible';

export interface StudentConductCase {
  readonly id: string;
  readonly studentId: string;
  readonly studentLabel: string;
  readonly companyName: string;
  readonly kind: ConductKind;
  readonly description: string;
  readonly status: ConductStatus;
  readonly filedAt: string;
  readonly decidedAt?: string;
  readonly decisionNote?: string;
  readonly appealNote?: string;
}

export const conductDecisionSchema = z.object({
  caseId: z.string().min(1),
  decision: z.enum(['dismissed', 'warning', 'visibility-reduced', 'ineligible']),
  note: z.string().trim().max(500).optional(),
});

export const conductAppealSchema = z.object({
  caseId: z.string().min(1),
  studentId: z.string().min(1),
  appeal: z.string().trim().min(3, 'Describe your appeal'),
});

// ── Offer-adjustment / pay-differential adjudication (Phase 5.14) ─────────────

export type AdjustmentStatus = 'open' | 'approved' | 'denied';

export interface OfferAdjustmentCase {
  readonly id: string;
  readonly recruiterId: string;
  readonly companyName: string;
  readonly studentLabel: string;
  readonly currentPaise: number;
  readonly newPaise: number;
  readonly category: string;
  readonly status: AdjustmentStatus;
  readonly filedAt: string;
  readonly decidedAt?: string;
  readonly decisionNote?: string;
}

export const adjustmentDecisionSchema = z.object({
  caseId: z.string().min(1),
  decision: z.enum(['approved', 'denied']),
  note: z.string().trim().max(500).optional(),
});

// ── Recruiter-side API keys (Phase 5.9) ──────────────────────────────────────

export type ApiKeyStatus = 'active' | 'revoked';

export interface ApiKey {
  readonly id: string;
  readonly recruiterId: string;
  readonly companyName: string;
  readonly scope: string;
  readonly status: ApiKeyStatus;
  readonly issuedAt: string;
  readonly revokedReason?: string;
  readonly revokedAt?: string;
}

export const apiKeyRevokeSchema = z.object({
  keyId: z.string().min(1),
  reason: z.string().trim().min(3, 'A reason is required'),
});

// ── Student-filed redressal (Phase 5.7, student side of the existing queue) ──

export const fileRedressalSchema = z.object({
  recruiterId: z.string().min(1),
  companyName: z.string().trim().min(1),
  studentLabel: z.string().trim().min(1),
  category: z.enum([
    'stipend-not-paid',
    'scope-creep-mid-internship',
    'harassment',
    'jd-term-breach',
    'contract-dishonoured',
  ]),
  description: z.string().trim().min(10, 'Describe what happened (min 10 chars)'),
  isInternship: z.coerce.boolean(),
});
