import type { HealthBand } from '../entities/recruiter';

/**
 * Company health score computation (Phase 5.11).
 *
 * The score is transparent to the recruiter — they see the band at
 * /recruiter/stats with a breakdown of the top contributing events.
 * Weights are admin-configurable; the values here are the initial
 * illustrative weights from the plan.
 *
 * The score is NOT predictive — it reflects past behavior only. No
 * ML risk-scoring of recruiters; this is a deterministic sum.
 */

export type HealthEvent =
  | 'analyzer-flag-resolved-at-submission'
  | 'analyzer-flag-posted-anyway'
  | 'ppt-no-show'
  | 'interview-slot-late-cancel'
  | 'post-offer-ghost'
  | 'redressal-dismissed'
  | 'redressal-warning'
  | 'redressal-upheld-score-impact'
  | 'redressal-upheld-api-revoke'
  | 'public-news-flag'
  | 'cycle-completed-successfully'
  | 'returning-recruiter'
  | 'above-recommended-stipend'
  | 'peer-review-positive';

export const HEALTH_EVENT_WEIGHTS: Readonly<Record<HealthEvent, number>> = {
  'analyzer-flag-resolved-at-submission': 0,
  'analyzer-flag-posted-anyway': -2,
  'ppt-no-show': -3,
  'interview-slot-late-cancel': -2,
  'post-offer-ghost': -5,
  'redressal-dismissed': 0,
  'redressal-warning': -3,
  'redressal-upheld-score-impact': -8,
  'redressal-upheld-api-revoke': -15,
  'public-news-flag': -5,
  'cycle-completed-successfully': 2,
  'returning-recruiter': 1,
  'above-recommended-stipend': 1,
  'peer-review-positive': 1,
};

export function bandFromScore(score: number): HealthBand {
  if (score >= 80) return 'excellent';
  if (score >= 50) return 'good';
  if (score >= 30) return 'watch';
  if (score >= 10) return 'restricted';
  return 'blacklisted';
}

export function computeHealthScore(events: readonly HealthEvent[]): number {
  return events.reduce((acc, event) => acc + HEALTH_EVENT_WEIGHTS[event], 0);
}
