/**
 * Audit log entries — emitted on every mutation per Phase 6.12a principle 3.
 * Retention: 7 years (confirmed decision).
 */

export type AuditActorType = 'recruiter' | 'admin' | 'student' | 'coordinator' | 'system';

export interface AuditEntry {
  readonly id: string;
  readonly actorType: AuditActorType;
  readonly actorId: string;
  readonly action: string; // e.g. "jd.published", "shortlist.created", "blacklist.applied"
  readonly targetTable: string;
  readonly targetId: string;
  readonly beforeJson?: string;
  readonly afterJson?: string;
  readonly traceId: string;
  readonly at: Date;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}
