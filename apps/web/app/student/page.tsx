import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudentShell, StatusPill } from '@nid/ui';
import { getStudentProfile, isOptedIn, listEligibleJds } from '@nid/module-student-portal';
import { listJdsByStatus } from '@nid/module-jd-posting';
import { isShortlisted } from '@nid/module-candidate-browse';
import { listOffers } from '@nid/module-offer-cascade';
import { DEMO_STUDENT } from '~/lib/demo-student';

export const metadata: Metadata = {
  title: 'Dashboard · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function StudentDashboard() {
  const { studentId, cycleId, cycleName } = DEMO_STUDENT;
  const profile = getStudentProfile(studentId);
  if (!profile) notFound();

  const optedIn = isOptedIn(studentId, cycleId);
  const eligible = listEligibleJds(studentId, cycleId);

  const published = listJdsByStatus('published');
  const shortlistedCount = published.filter((jd) => isShortlisted(jd.id, studentId)).length;
  const pendingOffers = published
    .flatMap((jd) => listOffers(jd.id))
    .filter((o) => o.studentId === studentId && o.status === 'pending').length;

  return (
    <StudentShell activeNav="dashboard" studentName={profile.name}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>{cycleName} · {profile.disciplineName} · {profile.programme === 'masters' ? 'M.Des' : 'B.Des'}</p>
            <h1 style={h1}>Welcome, {profile.name.split(' ')[0]}</h1>
            <div style={{ marginTop: 'var(--space-3)' }}>
              {optedIn ? (
                <StatusPill tone="success">Opted in to {cycleName}</StatusPill>
              ) : (
                <StatusPill tone="neutral">Not participating in {cycleName}</StatusPill>
              )}
            </div>
          </header>

          {!optedIn && (
            <p style={{ ...notice, marginBottom: 'var(--space-6)', textAlign: 'left' }}>
              You are not opted in to this cycle, so no openings are visible to recruiters or to you.{' '}
              <a href="/student/cycles" style={accentLink}>Manage participation →</a>
            </p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <Stat label="Eligible openings" value={eligible.length} href="/student/jds" />
            <Stat label="Shortlisted in" value={shortlistedCount} href="/student/applications" />
            <Stat label="Offers awaiting you" value={pendingOffers} href="/student/offers" emphasize={pendingOffers > 0} />
          </div>

          <div style={card}>
            <p style={{ ...label, marginBottom: 'var(--space-2)' }}>Your portfolio</p>
            <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-strong)' }}>
              {profile.portfolioHost}
            </p>
            <a href={profile.portfolioUrl} target="_blank" rel="noreferrer noopener" style={{ ...accentLink, fontSize: 'var(--fs-14)' }}>
              View external portfolio →
            </a>
            <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Recruiters reach your portfolio through NID&apos;s IPR-respecting link-out. You retain IPR over external work.
            </p>
          </div>
        </div>
      </section>
    </StudentShell>
  );
}

function Stat({ label: l, value, href, emphasize }: { label: string; value: number; href: string; emphasize?: boolean }) {
  return (
    <a
      href={href}
      style={{
        ...card,
        textDecoration: 'none',
        display: 'block',
        borderColor: emphasize ? 'var(--accent)' : 'var(--card-border)',
        borderWidth: emphasize ? '2px' : '1px',
        borderStyle: 'solid',
      }}
    >
      <p style={{ fontSize: 'var(--fs-40)', fontWeight: 'var(--fw-600)', color: emphasize ? 'var(--accent)' : 'var(--text-strong)', lineHeight: 1 }}>{value}</p>
      <p style={{ ...label, marginTop: 'var(--space-2)' }}>{l}</p>
    </a>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)' } as const;
const accentLink = { color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)' } as const;
