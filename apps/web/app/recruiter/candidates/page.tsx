import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { JdWorkspaceSelector, type JdWorkspaceOption } from '~/components/JdWorkspaceSelector';
import {
  CandidatesWorkspaceBody,
  type CandidateTileView,
} from '~/components/workspace/CandidatesWorkspaceBody';
import { RecruiterShell } from '@nid/ui';
import { listForRecruiter, type JdRecord } from '@nid/module-jd-posting';
import {
  listEligibleCandidates,
  listShortlist,
  type CandidateSort,
  type CandidateView,
} from '@nid/module-candidate-browse';
import { getStage, rankOf } from '@nid/module-recruiter-pipeline';
import { resolveOwnedJd } from '~/lib/recruiter-jd-guard';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { shortlistAction, unshortlistAction } from './actions';

export const metadata: Metadata = {
  title: 'Candidates · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

interface SearchParams {
  readonly jd?: string;
  readonly student?: string;
  readonly error?: string;
}

const CYCLE_LABEL = 'Spring 2026';
const BASE_PATH = '/recruiter/candidates';

/**
 * Candidates workspace (Round 4 §A — the linear-IA spine).
 *
 * Self-contained `activeNav="candidates"` workspace. Picks a published JD with the
 * `?jd=` `JdWorkspaceSelector`; for the chosen JD it renders the eligible-candidate
 * grid + shortlist inline (no navigation into `/recruiter/jds/[jdId]/…`, which used
 * to flip the top tab to "JDs"). A `?student=` deep link opens that candidate's
 * detail in the body's `Overlay` drawer. Ownership is resolved with the NON-throwing
 * `resolveOwnedJd` — an absent / foreign / stale `?jd=` falls through to the empty
 * selector state, never a 404 and never a leak. The recruiter layout sets
 * `dynamic = 'force-dynamic'`, so `?jd=`/`?student=` re-render per request.
 */
export default async function CandidatesWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { jd: jdParam, student: studentParam, error } = await searchParams;
  const { recruiterId, companyName } = await readRecruiterSession();

  const published = listForRecruiter(recruiterId).filter((jd) => jd.status === 'published');
  const options: JdWorkspaceOption[] = published.map(toOption);

  const jd = await resolveOwnedJd(jdParam);

  return (
    <RecruiterShell
      activeNav="candidates"
      companyName={companyName}
      accountMenu={<RecruiterAccountMenu companyName={companyName} />}
    >
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Review &amp; shortlist · filter by JD</p>
            <h1 style={h1}>Candidates</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', maxWidth: '60ch' }}>
              Portfolio-first discovery, discipline-filtered to the JD you pick. No ranking, no
              fit-score — open a candidate to read their statement and shortlist them individually
              with a required note.
            </p>
          </header>

          <div style={{ marginBottom: 'var(--space-8)' }}>
            <JdWorkspaceSelector
              jds={options}
              {...(jd ? { selectedJdId: jd.id } : {})}
              basePath={BASE_PATH}
            />
          </div>

          {options.length === 0 ? (
            <p style={notice}>
              No published JDs yet — publish a JD with confirmed target disciplines to review
              candidates. <a href="/recruiter/jds" style={accentLink}>Your JDs →</a>
            </p>
          ) : jd === null ? (
            <p style={notice}>Pick a JD above to review its eligible candidates.</p>
          ) : jd.status !== 'published' ? (
            <p style={notice}>
              This JD is <strong>{jd.status}</strong>. Candidates appear once it&rsquo;s published by
              the placement cell.
            </p>
          ) : (
            <CandidatesWorkspaceBody
              jdId={jd.id}
              jdTitle={jd.title}
              cycleLabel={CYCLE_LABEL}
              candidates={buildCandidates(jd)}
              {...(studentParam !== undefined ? { selectedStudentId: studentParam } : {})}
              shortlistDisabled={rankOf(getStage(jd.id)) > rankOf('shortlisting')}
              basePath={BASE_PATH}
              {...(error !== undefined ? { error } : {})}
              shortlistAction={shortlistAction}
              unshortlistAction={unshortlistAction}
            />
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

function toOption(jd: JdRecord): JdWorkspaceOption {
  return {
    id: jd.id,
    title: jd.title,
    ...(jd.location ? { location: jd.location } : {}),
  };
}

/**
 * Maps the JD's eligible candidates (discipline-filtered, sorted by discipline) +
 * the recruiter's shortlist notes down to the plain serializable tile views the
 * client body renders. Done here (server) so the client island never imports a
 * store. Sort is the narrow `discipline` union — no cgpa / fit-score option exists.
 */
function buildCandidates(jd: JdRecord): readonly CandidateTileView[] {
  const sort: CandidateSort = 'discipline';
  const eligible = listEligibleCandidates({
    cycleId: jd.cycleId,
    targetDisciplineIds: jd.targetDisciplineIds,
    sort,
  });
  const notes = new Map(listShortlist(jd.id).map((s) => [s.candidate.studentId, s.note]));

  return eligible.map((c) => {
    const note = notes.get(c.studentId);
    return {
      studentId: c.studentId,
      name: c.name,
      disciplineName: c.disciplineName,
      programme: c.programme,
      batchYear: c.batchYear,
      semester: c.semester,
      portfolioUrl: c.portfolioUrl,
      portfolioHost: c.portfolioHost,
      cvAvailable: c.cvAvailable,
      theme: disciplineTheme(c.accent),
      ...(c.statementOfIntent !== undefined ? { statementOfIntent: c.statementOfIntent } : {}),
      ...(note !== undefined ? { shortlistNote: note } : {}),
    };
  });
}

function disciplineTheme(accent: CandidateView['accent']): string {
  switch (accent) {
    case 'red':
      return 'communication';
    case 'cyan':
      return 'ux';
    case 'navy':
      return 'industrial';
    case 'purple':
      return 'textile';
    case 'yellow':
      return 'animation';
    case 'green':
      return 'furniture';
  }
}

const label = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
};
const h1 = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginTop: 'var(--space-1)',
};
const notice = {
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  padding: 'var(--space-8)',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--card-radius)',
  border: '1px dashed var(--border-emphasized)',
  textAlign: 'center' as const,
};
const accentLink = {
  color: 'var(--accent)',
  textDecoration: 'none',
  fontWeight: 'var(--fw-600)',
} as const;
