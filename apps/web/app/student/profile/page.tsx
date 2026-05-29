import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudentShell, StatusPill } from '@nid/ui';
import { getStudentProfile } from '@nid/module-student-portal';
import { DEMO_STUDENT } from '~/lib/demo-student';

export const metadata: Metadata = {
  title: 'Profile · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function StudentProfilePage() {
  const { studentId } = DEMO_STUDENT;
  const profile = getStudentProfile(studentId);
  if (!profile) notFound();

  const programmeLabel = profile.programme === 'masters' ? 'M.Des' : 'B.Des';

  return (
    <StudentShell activeNav="profile" studentName={profile.name}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Your record</p>
            <h1 style={h1}>Profile</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              This is what a recruiter sees once you opt in. The details below are verified from the institute
              registry — you don&apos;t edit them here. Whether recruiters can see you at all is your opt-in choice,
              managed under Cycles.
            </p>
          </header>

          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{profile.name}</p>
                <p style={{ ...label, marginTop: 'var(--space-1)' }}>{profile.disciplineName}</p>
              </div>
              <StatusPill tone="success">Verified from registry</StatusPill>
            </div>

            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)', margin: 'var(--space-5) 0 0' }}>
              <Detail term="Programme" value={`${programmeLabel} · ${profile.disciplineName}`} />
              <Detail term="Batch" value={String(profile.batchYear)} />
              <Detail term="Semester" value={String(profile.semester)} />
            </dl>

            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-default)' }}>
              <p style={label}>Portfolio</p>
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 'var(--space-2)', fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--accent)', textDecoration: 'none' }}
              >
                {profile.portfolioHost} ↗
              </a>
              <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                Opens your portfolio in a new tab.
              </p>
            </div>
          </div>

          <p style={notice}>
            To control whether recruiters can see this profile, go to <strong>Cycles</strong> and manage your opt-in.
          </p>
        </div>
      </section>
    </StudentShell>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt style={label}>{term}</dt>
      <dd style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{value}</dd>
    </div>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '2px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { marginTop: 'var(--space-4)', fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)' } as const;
