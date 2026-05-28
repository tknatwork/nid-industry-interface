import type { Metadata } from 'next';
import { RecruiterShell, StatusPill } from '@nid/ui';
import { listForRecruiter } from '@nid/module-jd-posting';
import { listAssignmentsForJd } from '@nid/module-slot-booking';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Interviews · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function InterviewsLauncher() {
  const { recruiterId, companyName } = DEMO_RECRUITER;
  const jds = listForRecruiter(recruiterId).filter((jd) => jd.status === 'published');

  return (
    <RecruiterShell activeNav="interviews" companyName={companyName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Interview day</p>
            <h1 style={h1}>Interviews</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Open the mobile-first console for a JD on its interview day. Tap a JD to see the live queue,
              cross-interview conflicts, and per-round outcomes.
            </p>
          </header>

          {jds.length === 0 ? (
            <p style={notice}>No published JDs yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {jds.map((jd) => {
                const assigned = listAssignmentsForJd(jd.id).length;
                return (
                  <a key={jd.id} href={`/recruiter/jds/${jd.id}/interviews`} style={rowCard}>
                    <div>
                      <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{jd.title}</p>
                      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>{jd.location} · {jd.interviewRounds.length} rounds</p>
                    </div>
                    <StatusPill tone={assigned > 0 ? 'info' : 'neutral'}>{assigned} scheduled</StatusPill>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const rowCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--space-4) var(--card-padding)', textDecoration: 'none' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
