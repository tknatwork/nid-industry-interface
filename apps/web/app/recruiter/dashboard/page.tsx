import type { Metadata } from 'next';
import { RecruiterShell, Button, StatusPill } from '@nid/ui';
import { listForRecruiter } from '@nid/module-jd-posting';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Dashboard · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function RecruiterDashboard() {
  const jds = listForRecruiter(DEMO_RECRUITER.recruiterId);
  const drafts = jds.filter((j) => j.status === 'draft').length;
  const inModeration = jds.filter((j) => j.status === 'in-moderation').length;
  const published = jds.filter((j) => j.status === 'published').length;

  return (
    <RecruiterShell activeNav="dashboard" companyName={DEMO_RECRUITER.companyName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p
            style={{
              fontSize: 'var(--fs-12)',
              fontWeight: 'var(--fw-600)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 'var(--space-2)',
            }}
          >
            Spring 2026 cycle
          </p>
          <h1
            style={{
              fontSize: 'var(--fs-40)',
              lineHeight: 'var(--lh-48)',
              fontWeight: 'var(--fw-500)',
              color: 'var(--text-strong)',
              marginBottom: 'var(--space-6)',
            }}
          >
            Welcome back
          </h1>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <StatCard label="Drafts" value={drafts} />
            <StatCard label="In moderation" value={inModeration} />
            <StatCard label="Published" value={published} />
            <StatCard label="Total JDs" value={jds.length} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <a href="/recruiter/jds/new" style={{ textDecoration: 'none' }}>
              <Button size="lg">Post a new JD</Button>
            </a>
            <a href="/recruiter/jds" style={{ textDecoration: 'none' }}>
              <Button size="lg" variant="secondary">
                View your JDs
              </Button>
            </a>
          </div>
        </div>
      </section>
    </RecruiterShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
      }}
    >
      <p
        style={{
          fontSize: 'var(--fs-40)',
          lineHeight: 1,
          fontWeight: 'var(--fw-600)',
          color: 'var(--text-strong)',
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 'var(--fs-12)',
          fontWeight: 'var(--fw-600)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginTop: 'var(--space-2)',
        }}
      >
        {label}
      </p>
    </div>
  );
}
