import { bandFromScore, computeHealthScore, type HealthBand, type HealthEvent } from '@nid/core';
import {
  blacklistAddSchema,
  blacklistLiftSchema,
  paymentDecisionSchema,
  redressalDecisionSchema,
  type ActionResult,
  type BlacklistEntry,
  type HealthEventRecord,
  type PaymentCase,
  type RecruiterScore,
  type RedressalCase,
  type RedressalStatus,
} from './types';
import {
  allBlacklist,
  allEvents,
  allPayments,
  allRedressal,
  appendEvent,
  updatePayment,
  updateRedressal,
  upsertBlacklist,
} from './store';

/**
 * A clean recruiter starts at 70 ("good"); events from @nid/core adjust up/down.
 * The core `computeHealthScore` is a pure delta-sum; the band scale (Phase 5.11)
 * is 0–100, so the baseline reconciles the two. Composition lives here, not in
 * core (core stays a pure primitive).
 */
const HEALTH_BASELINE = 70;

function scoreFromEvents(events: readonly HealthEventRecord[]): number {
  const delta = computeHealthScore(events.map((e) => e.event));
  return Math.max(0, Math.min(100, HEALTH_BASELINE + delta));
}

function activeBlacklistIds(): Set<string> {
  return new Set(allBlacklist().filter((b) => !b.lifted).map((b) => b.recruiterId));
}

/** One row per recruiter, worst score first (admin triage order). */
export function listRecruiterScores(): readonly RecruiterScore[] {
  const byRecruiter = new Map<string, HealthEventRecord[]>();
  for (const e of allEvents()) {
    const list = byRecruiter.get(e.recruiterId) ?? [];
    list.push(e);
    byRecruiter.set(e.recruiterId, list);
  }
  const blacklisted = activeBlacklistIds();

  return [...byRecruiter.entries()]
    .map(([recruiterId, events]) => {
      const score = scoreFromEvents(events);
      return {
        recruiterId,
        companyName: events[events.length - 1]?.companyName ?? recruiterId,
        score,
        band: bandFromScore(score),
        eventCount: events.length,
        blacklisted: blacklisted.has(recruiterId),
      } satisfies RecruiterScore;
    })
    .sort((a, b) => a.score - b.score);
}

export interface RecruiterScoreDetail {
  readonly recruiterId: string;
  readonly companyName: string;
  readonly score: number;
  readonly band: HealthBand;
  readonly events: readonly HealthEventRecord[];
  readonly blacklist: BlacklistEntry | null;
}

export function recruiterScoreDetail(recruiterId: string): RecruiterScoreDetail | null {
  const events = allEvents().filter((e) => e.recruiterId === recruiterId);
  if (events.length === 0) return null;
  const score = scoreFromEvents(events);
  const blacklist = allBlacklist().find((b) => b.recruiterId === recruiterId) ?? null;
  return {
    recruiterId,
    companyName: events[events.length - 1]?.companyName ?? recruiterId,
    score,
    band: bandFromScore(score),
    events: [...events].sort((a, b) => b.at.localeCompare(a.at)),
    blacklist,
  };
}

// ── Redressal ────────────────────────────────────────────────────────────────

export function listRedressal(status?: RedressalStatus): readonly RedressalCase[] {
  const all = allRedressal();
  const filtered = status ? all.filter((c) => c.status === status) : all;
  return [...filtered].sort((a, b) => b.filedAt.localeCompare(a.filedAt));
}

export function getRedressalCase(caseId: string): RedressalCase | null {
  return allRedressal().find((c) => c.id === caseId) ?? null;
}

const DECISION_TO_EVENT: Record<Exclude<RedressalStatus, 'open'>, HealthEvent> = {
  dismissed: 'redressal-dismissed',
  warning: 'redressal-warning',
  'upheld-score': 'redressal-upheld-score-impact',
  'upheld-revoke': 'redressal-upheld-api-revoke',
};

/** Decide a redressal case → records the decision AND emits the health event. */
export function decideRedressal(input: unknown): ActionResult {
  const parsed = redressalDecisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const { caseId, decision, note } = parsed.data;

  const existing = getRedressalCase(caseId);
  if (!existing) return { ok: false, reason: 'Case not found.' };
  if (existing.status !== 'open') return { ok: false, reason: 'This case is already decided.' };

  updateRedressal(caseId, {
    status: decision,
    decidedAt: new Date().toISOString(),
    ...(note ? { decisionNote: note } : {}),
  });
  appendEvent({
    recruiterId: existing.recruiterId,
    companyName: existing.companyName,
    event: DECISION_TO_EVENT[decision],
    at: new Date().toISOString(),
    ...(note ? { note } : {}),
  });
  return { ok: true };
}

// ── Blacklist ────────────────────────────────────────────────────────────────

export function listBlacklist(): readonly BlacklistEntry[] {
  return [...allBlacklist()].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export function addToBlacklist(input: unknown): ActionResult {
  const parsed = blacklistAddSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const detail = recruiterScoreDetail(parsed.data.recruiterId);
  if (!detail) return { ok: false, reason: 'Unknown recruiter.' };

  upsertBlacklist({
    recruiterId: parsed.data.recruiterId,
    companyName: detail.companyName,
    reason: parsed.data.reason,
    cooldownMonths: parsed.data.cooldownMonths,
    addedAt: new Date().toISOString(),
    lifted: false,
  });
  return { ok: true };
}

export function liftBlacklist(input: unknown): ActionResult {
  const parsed = blacklistLiftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const entry = allBlacklist().find((b) => b.recruiterId === parsed.data.recruiterId && !b.lifted);
  if (!entry) return { ok: false, reason: 'No active blacklist entry for this recruiter.' };

  upsertBlacklist({
    ...entry,
    lifted: true,
    liftedReason: parsed.data.reason,
    liftedAt: new Date().toISOString(),
  });
  return { ok: true };
}

// ── Payment cell ─────────────────────────────────────────────────────────────

export function listPaymentCases(): readonly PaymentCase[] {
  return [...allPayments()].sort((a, b) => b.filedAt.localeCompare(a.filedAt));
}

export function decidePaymentCase(input: unknown): ActionResult {
  const parsed = paymentDecisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const { caseId, decision, note } = parsed.data;
  const updated = updatePayment(caseId, {
    status: decision,
    decidedAt: new Date().toISOString(),
    ...(note ? { decisionNote: note } : {}),
  });
  return updated ? { ok: true } : { ok: false, reason: 'Payment case not found.' };
}
