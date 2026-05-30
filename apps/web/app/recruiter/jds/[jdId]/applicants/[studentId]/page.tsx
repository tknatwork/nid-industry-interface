import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { notFound } from 'next/navigation';
import { RecruiterShell, Button, Field, StatusPill } from '@nid/ui';
import { getJd } from '@nid/module-jd-posting';
import { getCandidate, isShortlisted, listShortlist, type CandidateView } from '@nid/module-candidate-browse';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { shortlistAction, unshortlistAction } from '../actions';

interface PageParams {
  readonly jdId: string;
  readonly studentId: string;
}
interface SearchParams {
  readonly error?: string;
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { studentId } = await params;
  const c = getCandidate(studentId);
  return {
    title: `${c?.name ?? studentId} · Applicant · NID Industry Interface`,
    robots: { index: false, follow: false },
  };
}

export default async function CandidateDetail({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { jdId, studentId } = await params;
  const jd = getJd(jdId);
  if (!jd) notFound();
  const candidate = getCandidate(studentId);
  if (!candidate) notFound();

  const error = (await searchParams).error;
  const shortlisted = isShortlisted(jdId, studentId);
  const existingNote = listShortlist(jdId).find((s) => s.candidate.studentId === studentId)?.note;

  return (
    <RecruiterShell activeNav="jds" companyName={DEMO_RECRUITER.companyName} accountMenu={<RecruiterAccountMenu companyName={DEMO_RECRUITER.companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <a href={`/recruiter/jds/${jdId}/applicants`} style={backLink}>
            ← All applicants
          </a>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
              gap: 'var(--space-8)',
            }}
          >
            <div>
              <header style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                    {candidate.name}
                  </h1>
                  {shortlisted && <StatusPill tone="success">Shortlisted</StatusPill>}
                </div>
                <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-secondary)' }}>
                  {candidate.disciplineName} · {candidate.programme === 'masters' ? 'M.Des' : 'B.Des'} · semester{' '}
                  {candidate.semester} · batch {candidate.batchYear}
                </p>
              </header>

              {/* Portfolio-first: large placeholder + link-out with IPR note */}
              <div
                data-discipline={disciplineTheme(candidate.accent)}
                style={{
                  borderRadius: 'var(--card-radius)',
                  overflow: 'hidden',
                  border: '1px solid var(--card-border)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    aspectRatio: '16 / 9',
                    backgroundColor: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-on-accent)',
                    fontSize: 'var(--fs-14)',
                    fontWeight: 'var(--fw-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Portfolio preview (hosted on {candidate.portfolioHost})
                </div>
                <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)' }}>
                  <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
                    This portfolio is hosted externally at <strong>{candidate.portfolioHost}</strong>. The student retains
                    IPR over their work. You are leaving NID&rsquo;s surface to view it.
                  </p>
                  <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" size="sm">
                      View external portfolio ↗
                    </Button>
                  </a>
                  <span style={{ display: 'inline-block', marginLeft: 'var(--space-3)' }}>
                    {candidate.cvAvailable ? (
                      <Button variant="ghost" size="sm">
                        Download CV (PDF)
                      </Button>
                    ) : (
                      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>CV not provided</span>
                    )}
                  </span>
                </div>
              </div>

              {candidate.statementOfIntent && (
                <section
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--card-radius)',
                    padding: 'var(--card-padding)',
                  }}
                >
                  <h2 style={sectionLabel}>Statement of intent</h2>
                  <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-strong)', lineHeight: 1.6 }}>
                    {candidate.statementOfIntent}
                  </p>
                </section>
              )}
            </div>

            <aside>
              <div
                style={{
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--card-radius)',
                  padding: 'var(--card-padding)',
                  position: 'sticky',
                  top: 'var(--space-6)',
                }}
              >
                <h2 style={sectionLabel}>{shortlisted ? 'Shortlisted' : 'Shortlist this candidate'}</h2>
                <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
                  A note is required — NID asks recruiters to evaluate each designer individually, not in bulk.
                </p>

                {error && (
                  <p role="alert" style={errorText}>
                    {decodeURIComponent(error)}
                  </p>
                )}

                <form action={shortlistAction} style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  <input type="hidden" name="jdId" value={jdId} />
                  <input type="hidden" name="studentId" value={studentId} />
                  <Field
                    id="note"
                    name="note"
                    label="Your note"
                    placeholder="Why this candidate? (required)"
                    required
                    defaultValue={existingNote ?? ''}
                  />
                  <Button type="submit" size="sm">
                    {shortlisted ? 'Update note' : 'Shortlist'}
                  </Button>
                </form>

                {shortlisted && (
                  <form action={unshortlistAction} style={{ marginTop: 'var(--space-3)' }}>
                    <input type="hidden" name="jdId" value={jdId} />
                    <input type="hidden" name="studentId" value={studentId} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remove from shortlist
                    </Button>
                  </form>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </RecruiterShell>
  );
}

const backLink = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 'var(--space-4)',
};
const sectionLabel = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-3)',
};
const errorText = {
  fontSize: 'var(--fs-12)',
  color: 'var(--input-error-text)',
  fontWeight: 'var(--fw-600)',
  marginBottom: 'var(--space-3)',
};

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
