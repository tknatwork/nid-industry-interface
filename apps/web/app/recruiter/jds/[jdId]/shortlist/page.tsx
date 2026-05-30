import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { notFound } from 'next/navigation';
import { RecruiterShell, Button } from '@nid/ui';
import { getJd } from '@nid/module-jd-posting';
import { listShortlist } from '@nid/module-candidate-browse';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Shortlist · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function ShortlistPage({ params }: { params: Promise<{ jdId: string }> }) {
  const { jdId } = await params;
  const jd = getJd(jdId);
  if (!jd) notFound();
  const shortlist = listShortlist(jdId);

  return (
    <RecruiterShell activeNav="jds" companyName={DEMO_RECRUITER.companyName} accountMenu={<RecruiterAccountMenu companyName={DEMO_RECRUITER.companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <a href={`/recruiter/jds/${jdId}/applicants`} style={backLink}>← Applicants</a>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>{jd.title}</p>
            <h1 style={h1}>Shortlist</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Each student was shortlisted individually with a required note. These are the interview rounds they
              are invited to — book slots next.
            </p>
          </header>

          <div style={{ ...card, marginBottom: 'var(--space-6)' }}>
            <p style={{ ...label, marginBottom: 'var(--space-2)' }}>Interview rounds (defined at posting)</p>
            <ol style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
              {jd.interviewRounds.map((r) => <li key={r.round}>{r.focus}</li>)}
            </ol>
          </div>

          {shortlist.length === 0 ? (
            <p style={notice}>
              No one shortlisted yet. <a href={`/recruiter/jds/${jdId}/applicants`} style={accentLink}>Browse applicants →</a>
            </p>
          ) : (
            <>
              <p style={{ ...label, marginBottom: 'var(--space-3)' }}>{shortlist.length} shortlisted</p>
              <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                {shortlist.map((s) => (
                  <div key={s.candidate.studentId} style={card}>
                    <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                      {s.candidate.name} · {s.candidate.disciplineName}
                    </p>
                    <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                      Your note: {s.note}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <a href={`/recruiter/jds/${jdId}/slots`} style={{ textDecoration: 'none' }}><Button size="sm">Book interview slots</Button></a>
                <a href={`/recruiter/jds/${jdId}/offers`} style={{ textDecoration: 'none' }}><Button size="sm" variant="secondary">Go to offers</Button></a>
              </div>
            </>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const backLink = { ...label, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
const accentLink = { color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)' } as const;
