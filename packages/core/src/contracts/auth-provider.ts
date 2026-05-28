/**
 * AuthProvider — authentication adapter contract.
 *
 * Used for:
 * - Recruiter login (after admin-issued credentials).
 * - Admin login (placement-cell staff + student coordinators).
 * - Student SSO from nid.edu (likely magic-link or institutional SSO).
 *
 * Implementations: NextAuth (default), institutional SSO (future).
 */

export type ActorType = 'recruiter' | 'admin' | 'student' | 'coordinator';

export interface AuthSession {
  readonly actorId: string;
  readonly actorType: ActorType;
  readonly recruiterId?: string;
  readonly campusId?: string;
  readonly issuedAt: Date;
  readonly expiresAt: Date;
  readonly scopes: readonly string[];
}

export interface MagicLinkRequest {
  readonly email: string;
  readonly actorType: ActorType;
  readonly redirectAfterLogin?: string;
}

export interface AuthProvider {
  /** Issue a magic-link email for the given actor type. */
  requestMagicLink(req: MagicLinkRequest): Promise<{ requested: true }>;

  /** Resolve a magic-link token into a session. */
  verifyMagicLink(token: string): Promise<AuthSession>;

  /** Mint credentials for an approved recruiter (admin action). Used in Phase 4.1 flow. */
  issueRecruiterCredentials(recruiterId: string): Promise<{ username: string; temporaryPassword: string }>;

  /** Verify an active session. */
  verifySession(sessionToken: string): Promise<AuthSession | null>;

  /** End a session (logout). */
  endSession(sessionToken: string): Promise<{ ended: true }>;
}
