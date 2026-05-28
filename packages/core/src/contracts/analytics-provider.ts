/**
 * AnalyticsProvider — product analytics + observability adapter contract.
 *
 * Used for:
 * - Recruiter-side post-cycle analytics (Phase 4.13).
 * - Admin cross-cycle KPIs.
 * - Health-score event tracking.
 * - Funnel + session replays.
 *
 * Implementation: PostHog (self-hostable for data sovereignty).
 */

export type AnalyticsEventName =
  | 'recruiter.application.submitted'
  | 'recruiter.token.tracker.viewed'
  | 'recruiter.payment.completed'
  | 'recruiter.credentials.issued'
  | 'recruiter.jd.draft.saved'
  | 'recruiter.jd.published'
  | 'recruiter.jd.withdrawn'
  | 'recruiter.candidate.viewed'
  | 'recruiter.candidate.shortlisted'
  | 'recruiter.slot.booked'
  | 'recruiter.offer.issued'
  | 'recruiter.offer.cascade'
  | 'recruiter.health.band.changed'
  | 'student.cycle.opted-in'
  | 'student.application.submitted'
  | 'student.offer.responded'
  | 'student.redressal.filed'
  | 'admin.jd.moderated'
  | 'admin.recruiter.approved'
  | 'admin.blacklist.added'
  | 'admin.api-key.revoked';

export interface AnalyticsEvent {
  readonly name: AnalyticsEventName;
  readonly distinctId: string; // actor id (or token id for pre-auth flows)
  readonly properties?: Readonly<Record<string, string | number | boolean | null>>;
  readonly cycleId?: string;
  readonly traceId: string;
  readonly occurredAt?: Date;
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): Promise<{ tracked: true }>;
  trackBatch(events: readonly AnalyticsEvent[]): Promise<{ tracked: number }>;
  identify(distinctId: string, traits: Readonly<Record<string, unknown>>): Promise<{ identified: true }>;
}
