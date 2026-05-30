import { bandFromScore, computeHealthScore, type HealthBand, type HealthEvent } from '@nid/core';
import {
  adjustmentDecisionSchema,
  apiKeyRevokeSchema,
  blacklistAddSchema,
  blacklistLiftSchema,
  conductAppealSchema,
  conductDecisionSchema,
  fileRedressalSchema,
  paymentDecisionSchema,
  redressalDecisionSchema,
  type ActionResult,
  type ApiKey,
  type BlacklistEntry,
  type HealthEventRecord,
  type OfferAdjustmentCase,
  type PaymentCase,
  type RecruiterScore,
  type RedressalCase,
  type RedressalStatus,
  type StudentConductCase,
} from './types';
import {
  allAdjustments,
  allApiKeys,
  allBlacklist,
  allConduct,
  allEvents,
  allPayments,
  allRedressal,
  appendEvent,
  insertRedressal,
  updateAdjustment,
  updateApiKey,
  updateConduct,
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

// ── Student-filed redressal (Phase 5.7 — student side files into the queue) ──

/** A student files a complaint against a company → lands open in the admin queue. */
export function fileRedressal(input: unknown): ActionResult {
  const parsed = fileRedressalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  insertRedressal({
    recruiterId: parsed.data.recruiterId,
    companyName: parsed.data.companyName,
    studentLabel: parsed.data.studentLabel,
    category: parsed.data.category,
    description: parsed.data.description,
    isInternship: parsed.data.isInternship,
  });
  return { ok: true };
}

/**
 * The two redressal outcomes that count as *institution-verified*: the
 * authority upheld the student's report. `warning` and `dismissed` are NOT
 * upheld; `open` is still pending review and never counts (plan §K, §Q —
 * "becomes a strike only when the authority upholds it"). Single source of
 * truth so the transparency tab and the strike count never drift apart.
 */
const UPHELD_REDRESSAL_STATUSES: ReadonlySet<RedressalStatus> = new Set([
  'upheld-score',
  'upheld-revoke',
]);

function isUpheld(c: RedressalCase): boolean {
  return UPHELD_REDRESSAL_STATUSES.has(c.status);
}

/** Anonymised redressal stats for a company's public transparency tab (Phase 5.7). */
export function transparencyFor(companyName: string): {
  total: number;
  byCategory: Readonly<Record<string, number>>;
  upheld: number;
} {
  const cases = allRedressal().filter((c) => c.companyName === companyName);
  const byCategory: Record<string, number> = {};
  let upheld = 0;
  for (const c of cases) {
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    if (isUpheld(c)) upheld += 1;
  }
  return { total: cases.length, byCategory, upheld };
}

// ── Institution-verified strikes (plan §K, §Q) ───────────────────────────────

/**
 * Demo rule: **3 verified strikes → blacklist**. A "verified strike" is an
 * admin-UPHELD redressal — open/pending student reports do NOT count, and
 * neither do `warning` or `dismissed` outcomes. The recruiter dashboard shows
 * this as a `0/3` tag (plan §K "strike tag", §Q "verified-strike count").
 */
export const BLACKLIST_STRIKE_THRESHOLD = 3;

/**
 * Count of institution-verified strikes for one recruiter = number of
 * admin-upheld redressals against them. Pending (`open`) student reports are
 * excluded by design: a report only becomes a strike once the placement cell
 * upholds it. Does not touch the health-score math — it reads the same
 * redressal ledger from a different angle.
 */
export function verifiedStrikeCount(recruiterId: string): number {
  return allRedressal().filter((c) => c.recruiterId === recruiterId && isUpheld(c)).length;
}

export interface VerifiedStrikeRow {
  readonly recruiterId: string;
  readonly companyName: string;
  /** Admin-upheld redressals (pending reports excluded). */
  readonly strikes: number;
  /** The demo blacklist trigger — `BLACKLIST_STRIKE_THRESHOLD` (3). */
  readonly threshold: number;
  /** `true` once `strikes >= threshold` — eligible for the blacklist trigger. */
  readonly meetsThreshold: boolean;
}

/**
 * One verified-strike row per recruiter that has at least one redressal on
 * file, worst (most strikes) first. Lets a dashboard render a `0/3`-style tag
 * without re-deriving the upheld rule itself. Recruiters with zero redressals
 * are omitted (they have nothing to show); the UI renders `0/3` for them from
 * `verifiedStrikeCount` directly.
 */
export function listVerifiedStrikes(): readonly VerifiedStrikeRow[] {
  const byRecruiter = new Map<string, { companyName: string; strikes: number }>();
  for (const c of allRedressal()) {
    const row = byRecruiter.get(c.recruiterId) ?? { companyName: c.companyName, strikes: 0 };
    row.companyName = c.companyName;
    if (isUpheld(c)) row.strikes += 1;
    byRecruiter.set(c.recruiterId, row);
  }
  return [...byRecruiter.entries()]
    .map(([recruiterId, { companyName, strikes }]) => ({
      recruiterId,
      companyName,
      strikes,
      threshold: BLACKLIST_STRIKE_THRESHOLD,
      meetsThreshold: strikes >= BLACKLIST_STRIKE_THRESHOLD,
    }))
    .sort((a, b) => b.strikes - a.strikes);
}

/**
 * The 3-verified-strikes → blacklist demo rule, as a predicate. `true` when the
 * recruiter has accrued at least `BLACKLIST_STRIKE_THRESHOLD` admin-upheld
 * redressals. This is the *trigger* signal only — it does not itself blacklist
 * (that stays an explicit, logged admin action via `addToBlacklist`).
 */
export function meetsBlacklistStrikeThreshold(recruiterId: string): boolean {
  return verifiedStrikeCount(recruiterId) >= BLACKLIST_STRIKE_THRESHOLD;
}

// ── Student conduct (Phase 5.10) ─────────────────────────────────────────────

export function listStudentConduct(): readonly StudentConductCase[] {
  return [...allConduct()].sort((a, b) => b.filedAt.localeCompare(a.filedAt));
}
export function listStudentConductFor(studentId: string): readonly StudentConductCase[] {
  return listStudentConduct().filter((c) => c.studentId === studentId);
}
export function decideStudentConduct(input: unknown): ActionResult {
  const parsed = conductDecisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const { caseId, decision, note } = parsed.data;
  const updated = updateConduct(caseId, {
    status: decision,
    decidedAt: new Date().toISOString(),
    ...(note ? { decisionNote: note } : {}),
  });
  return updated ? { ok: true } : { ok: false, reason: 'Conduct case not found.' };
}
export function appealStudentConduct(input: unknown): ActionResult {
  const parsed = conductAppealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const existing = allConduct().find((c) => c.id === parsed.data.caseId);
  if (!existing) return { ok: false, reason: 'Conduct case not found.' };
  if (existing.studentId !== parsed.data.studentId) return { ok: false, reason: 'Not your case to appeal.' };
  updateConduct(parsed.data.caseId, { appealNote: parsed.data.appeal });
  return { ok: true };
}

// ── Offer-adjustment / pay-differential (Phase 5.14) ─────────────────────────

export function listOfferAdjustments(): readonly OfferAdjustmentCase[] {
  return [...allAdjustments()].sort((a, b) => b.filedAt.localeCompare(a.filedAt));
}
export function decideOfferAdjustment(input: unknown): ActionResult {
  const parsed = adjustmentDecisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const { caseId, decision, note } = parsed.data;
  const updated = updateAdjustment(caseId, {
    status: decision,
    decidedAt: new Date().toISOString(),
    ...(note ? { decisionNote: note } : {}),
  });
  return updated ? { ok: true } : { ok: false, reason: 'Adjustment case not found.' };
}

// ── Recruiter API keys (Phase 5.9) ───────────────────────────────────────────

export function listApiKeys(): readonly ApiKey[] {
  return [...allApiKeys()].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}
export function revokeApiKey(input: unknown): ActionResult {
  const parsed = apiKeyRevokeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
  const key = allApiKeys().find((k) => k.id === parsed.data.keyId && k.status === 'active');
  if (!key) return { ok: false, reason: 'No active key with that id.' };
  updateApiKey(parsed.data.keyId, {
    status: 'revoked',
    revokedReason: parsed.data.reason,
    revokedAt: new Date().toISOString(),
  });
  return { ok: true };
}
