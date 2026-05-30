import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell } from '@nid/ui';
import { listForRecruiter } from '@nid/module-jd-posting';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { resolveOwnedJd } from '~/lib/recruiter-jd-guard';
import { JdWorkspaceSelector, type JdWorkspaceOption } from '~/components/JdWorkspaceSelector';
import { InterviewWorkspaceBody } from '~/components/workspace/InterviewWorkspaceBody';
import { buildInterviewWorkspaceVM } from '~/components/workspace/interview-workspace-data';
import {
  savePlanAction,
  lockPlanAction,
  overrideAssignmentAction,
  recordOutcomeAction,
  advanceRoundAction,
  lockSelectionAction,
  sendLetterAction,
  setTransportAction,
} from './actions';

export const metadata: Metadata = {
  title: 'Interviews · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

/**
 * Interview workspace (Round 4 §A/§C) — the canonical, self-contained
 * Before/During/After surface under the **Interviews** top tab.
 *
 * A Server Component: it reads the `?jd=` selector with the NON-throwing
 * `resolveOwnedJd` (an unknown/foreign id renders the empty selector, never a
 * 404), maps the recruiter's published JDs down to the plain
 * `JdWorkspaceSelector` shape, then — when a JD resolves — assembles fully
 * serializable view-model props and hands the workspace body the server actions
 * as props. The recruiter layout sets `dynamic = 'force-dynamic'`, so changing
 * `?jd=` / `?phase=` re-renders per request.
 *
 * The old per-JD `…/jds/[jdId]/interviews` route now redirects here, which also
 * fixes the long-standing `activeNav="jds"` tab-identity bug.
 */
export default async function InterviewsWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ jd?: string; phase?: string }>;
}) {
  const { jd: jdParam, phase } = await searchParams;
  const { recruiterId, companyName } = await readRecruiterSession();

  const published = listForRecruiter(recruiterId).filter((j) => j.status === 'published');
  const options: JdWorkspaceOption[] = published.map((j) => ({
    id: j.id,
    title: j.title,
    ...(j.location !== undefined ? { location: j.location } : {}),
  }));

  const jd = await resolveOwnedJd(jdParam);
  const vm = jd ? buildInterviewWorkspaceVM(jd, recruiterId) : null;

  return (
    <RecruiterShell
      activeNav="interviews"
      companyName={companyName}
      accountMenu={<RecruiterAccountMenu companyName={companyName} />}
    >
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-8)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Interview day</p>
            <h1 style={h1}>Interviews</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Plan the interviews, run the rounds, then tally and send your decision — one linear flow per JD. Pick a
              JD to begin.
            </p>
          </header>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <JdWorkspaceSelector
              jds={options}
              basePath="/recruiter/interviews"
              label="Job description"
              {...(jd ? { selectedJdId: jd.id } : {})}
            />
          </div>

          {vm === null ? (
            <p style={notice}>
              {options.length === 0
                ? 'No published JDs yet. Publish a JD to plan its interviews.'
                : 'Choose one of your published JDs above to open its interview workspace.'}
            </p>
          ) : (
            <InterviewWorkspaceBody
              vm={vm}
              {...(phase !== undefined ? { phase } : {})}
              savePlanAction={savePlanAction}
              lockPlanAction={lockPlanAction}
              overrideAssignmentAction={overrideAssignmentAction}
              recordOutcomeAction={recordOutcomeAction}
              advanceRoundAction={advanceRoundAction}
              lockSelectionAction={lockSelectionAction}
              sendLetterAction={sendLetterAction}
              setTransportAction={setTransportAction}
            />
          )}
        </div>
      </section>
    </RecruiterShell>
  );
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
  padding: 'var(--space-6)',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--radius-2)',
  border: '1px dashed var(--border-emphasized)',
  textAlign: 'center' as const,
};
