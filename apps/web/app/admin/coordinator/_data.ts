/**
 * Coordinator-scoped read model (plan §Q).
 *
 * Pulls together — for the *coordinator's assigned companies only* — the
 * recruiting company, its published JDs, the selected (shortlisted) students,
 * each candidate's booked slot + expected interviewers, and the live
 * round-progress record the coordinator edits. Every read funnels through
 * {@link canCoordinatorAccessCompany} so a coordinator can never resolve a
 * company outside `DEMO_COORDINATOR.assignedCompanies` — the §Q "deny others"
 * rule lives in one place.
 *
 * Cross-module data comes exclusively through the public `@nid/module-*`
 * indexes; company display names come from the public-content seed
 * (`recruiter-public.ts`), matching how the recruiter dashboard resolves them.
 */
import { listForRecruiter, type JdRecord } from '@nid/module-jd-posting';
import { listShortlist, type CandidateView } from '@nid/module-candidate-browse';
import { listAssignmentsForJd, slotById, type Slot } from '@nid/module-slot-booking';
import { getCandidateRounds, type RoundProgress } from '@nid/module-interview-console';
import {
  DEMO_COORDINATOR,
  adminRoleLabel,
  canCoordinatorAccessCompany,
  resolveAdminRole,
  type AdminRole,
} from '~/lib/demo-coordinator';
import { MICROSITES, ALL_COORDINATORS } from '~/lib/recruiter-public';
import { subRolesForRecruiter, labelsForSubRoleIds } from '~/lib/recruiter-subroles';

/** recruiterId → public company name, from the microsite seed (same source the dashboard uses). */
const COMPANY_NAME_BY_RECRUITER: Readonly<Record<string, string>> = Object.fromEntries(
  Object.values(MICROSITES).map((m): readonly [string, string] => [m.recruiterId, m.companyName]),
);

/** Display name for a recruiting company, falling back to the raw id if unseeded. */
export function companyName(recruiterId: string): string {
  return COMPANY_NAME_BY_RECRUITER[recruiterId] ?? recruiterId;
}

/** One selected candidate enriched with their slot, interviewers, and live round-progress. */
export interface CoordinatorCandidate {
  readonly candidate: CandidateView;
  /** Recruiter's shortlist note — context for the coordinator's on-the-day ops. */
  readonly note: string;
  /** Booked slot, when the recruiter has scheduled this candidate. */
  readonly slot: Slot | null;
  /**
   * Expected interviewers on the booked slot, resolved from the company's
   * named sub-roles (§P) to display labels ("Priya Menon · HR Director").
   * `SlotAssignment.interviewers` stores sub-role ids; we label them here.
   */
  readonly interviewers: readonly string[];
  /** Live shared round-progress record — what the coordinator edits (§Q). */
  readonly progress: RoundProgress;
}

/** A JD owned by an assigned company, with its selected candidates. */
export interface CoordinatorJd {
  readonly jd: JdRecord;
  readonly candidates: readonly CoordinatorCandidate[];
}

/** The full coordinator view of a single assigned company. */
export interface CoordinatorCompany {
  readonly recruiterId: string;
  readonly company: string;
  /** Published JDs only — coordination is an interview-window activity. */
  readonly jds: readonly CoordinatorJd[];
  readonly selectedCount: number;
  readonly bookedCount: number;
}

/** Resolve one assigned company's full coordinator view, or null if out of scope. */
export function companyView(recruiterId: string, role: AdminRole = resolveAdminRole()): CoordinatorCompany | null {
  if (!canCoordinatorAccessCompany(recruiterId, role)) return null;

  // The company's named sub-role roster (§P) — used to label interviewer ids.
  const roster = subRolesForRecruiter(recruiterId);

  const jds = listForRecruiter(recruiterId)
    .filter((jd) => jd.status === 'published')
    .map((jd): CoordinatorJd => {
      const assignments = listAssignmentsForJd(jd.id);
      const slotByStudent = new Map(assignments.map((a) => [a.studentId, a] as const));
      const candidates = listShortlist(jd.id).map(({ candidate, note }): CoordinatorCandidate => {
        const assignment = slotByStudent.get(candidate.studentId);
        const slot = assignment ? slotById(assignment.slotId) : null;
        return {
          candidate,
          note,
          slot,
          interviewers: assignment ? labelsForSubRoleIds(assignment.interviewers, roster) : [],
          progress: getCandidateRounds(jd.id, candidate.studentId),
        };
      });
      return { jd, candidates };
    });

  const selectedCount = jds.reduce((n, j) => n + j.candidates.length, 0);
  const bookedCount = jds.reduce((n, j) => n + j.candidates.filter((c) => c.slot !== null).length, 0);

  return { recruiterId, company: companyName(recruiterId), jds, selectedCount, bookedCount };
}

/** Every company the current coordinator is assigned to (scope-filtered). */
export function assignedCompanyViews(role: AdminRole = resolveAdminRole()): readonly CoordinatorCompany[] {
  return (DEMO_COORDINATOR.assignedCompanies as readonly string[])
    .map((id) => companyView(id, role))
    .filter((v): v is CoordinatorCompany => v !== null);
}

/**
 * AdminShell role props for a coordinator-scoped page, exactOptionalProps-safe:
 * `roleLabel` is OMITTED (not set to undefined) when the actor is a full admin
 * previewing the route. Spread directly onto `<AdminShell {...} />`.
 */
export function coordinatorShellProps(
  role: AdminRole = resolveAdminRole(),
): { readonly role: 'coordinator'; readonly roleLabel?: string } {
  const label = adminRoleLabel(role);
  return label !== undefined ? { role: 'coordinator', roleLabel: label } : { role: 'coordinator' };
}

/**
 * The coordinator's own directory record (name shown to the assigned cohort).
 * Resolves from the seeded `COORDINATORS` directory by coordinator id, falling
 * back to the demo identity's name.
 */
export function coordinatorDisplayName(): string {
  const match = ALL_COORDINATORS.find((c) => c.id === COORD_DIRECTORY_ID);
  return match?.name ?? DEMO_COORDINATOR.name;
}

// The demo coordinator (COORD-2026-A-01) maps to the seeded Acme coordinator
// record (COORD-A-1) in recruiter-public; both name the same person. Kept as a
// constant so the link is explicit rather than a fragile name match.
const COORD_DIRECTORY_ID = 'COORD-A-1';
