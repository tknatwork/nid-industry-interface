import { getCompanyRecord } from '@nid/module-recruiter-onboarding';
import { PARENT_COMPANIES, type ParentCompany } from './recruiter-public';

/**
 * Server-only branch-identity helpers (Round 3 §D).
 *
 * These resolve a recruiter's parent company + branch label from its onboarding
 * ticket, so they pull the recruiter-onboarding store (`node:fs`). They MUST
 * live here, NOT in `recruiter-public.ts` — that module is imported by client
 * components (e.g. `RecruiterLogoWall`) and has to stay store-free, or the
 * server-only store leaks into the client bundle (`node:fs`/`postgres`
 * UnhandledSchemeError at build). Only server components import these.
 */

/**
 * Resolve the parent company a recruiter belongs to, via its onboarding ticket's
 * `parentCompanyId`. Returns null when the recruiter has no ticket, carries no
 * parent grouping (a standalone recruiter), or names a parent that isn't in
 * {@link PARENT_COMPANIES}.
 */
export function parentCompanyFor(recruiterId: string): ParentCompany | null {
  const record = getCompanyRecord(recruiterId);
  const parentId = record?.parentCompanyId;
  if (parentId == null) return null;
  return PARENT_COMPANIES[parentId] ?? null;
}

/**
 * Resolve a recruiter's branch label (e.g. 'Bengaluru') via its onboarding
 * ticket's `branchLabel`. Returns null when there is no ticket or the recruiter
 * isn't part of a multi-branch company.
 */
export function branchLabelFor(recruiterId: string): string | null {
  const record = getCompanyRecord(recruiterId);
  return record?.branchLabel ?? null;
}
