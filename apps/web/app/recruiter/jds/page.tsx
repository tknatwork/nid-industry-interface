import type { Metadata } from 'next';
import { RecruiterShell, Button, StatusPill, type StatusTone } from '@nid/ui';
import { listForRecruiter, skillLabel, type JdRecord } from '@nid/module-jd-posting';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Job descriptions · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function RecruiterJdsPage() {
  const jds = listForRecruiter(DEMO_RECRUITER.recruiterId);

  return (
    <RecruiterShell activeNav="jds" companyName={DEMO_RECRUITER.companyName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <div>
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
                {jds.length} {jds.length === 1 ? 'job description' : 'job descriptions'}
              </p>
              <h1
                style={{
                  fontSize: 'var(--fs-40)',
                  lineHeight: 'var(--lh-48)',
                  fontWeight: 'var(--fw-500)',
                  color: 'var(--text-strong)',
                }}
              >
                Your job descriptions
              </h1>
            </div>
            <a href="/recruiter/jds/new" style={{ textDecoration: 'none' }}>
              <Button>Post a new JD</Button>
            </a>
          </div>

          {jds.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {jds.map((jd) => (
                <JdCard key={jd.id} jd={jd} />
              ))}
            </div>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px dashed var(--border-emphasized)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--space-16)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 'var(--fs-18)', color: 'var(--text-strong)', marginBottom: 'var(--space-2)' }}>
        No job descriptions yet
      </p>
      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
        Post your first JD to start receiving applications this cycle.
      </p>
      <a href="/recruiter/jds/new" style={{ textDecoration: 'none' }}>
        <Button>Post a new JD</Button>
      </a>
    </div>
  );
}

function JdCard({ jd }: { jd: JdRecord }) {
  return (
    <article
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: '280px' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <h2 style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
            {jd.title || 'Untitled draft'}
          </h2>
          <StatusPill tone={statusTone(jd.status)}>{statusLabel(jd.status)}</StatusPill>
        </div>
        <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
          {roleTypeLabel(jd.roleType)} · {jd.location || 'location TBD'} · {jd.workMode} · {jd.positions}{' '}
          {jd.positions === 1 ? 'position' : 'positions'}
        </p>
        {jd.skills.length > 0 && (
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
            {jd.skills
              .slice(0, 6)
              .map((s) => skillLabel(s.slug) + (s.required ? '' : ' (preferred)'))
              .join(' · ')}
            {jd.skills.length > 6 ? ` +${jd.skills.length - 6} more` : ''}
          </p>
        )}
      </div>
      <div style={{ textAlign: 'right', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
        <p>{compLabel(jd)}</p>
        <p style={{ marginTop: 'var(--space-1)' }}>{jd.interviewRounds.length} interview rounds</p>
      </div>
    </article>
  );
}

function statusLabel(status: JdRecord['status']): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'in-moderation':
      return 'In moderation';
    case 'published':
      return 'Published';
    case 'closed':
      return 'Closed';
    case 'withdrawn':
      return 'Withdrawn';
  }
}

function statusTone(status: JdRecord['status']): StatusTone {
  switch (status) {
    case 'draft':
      return 'neutral';
    case 'in-moderation':
      return 'warning';
    case 'published':
      return 'success';
    case 'closed':
      return 'neutral';
    case 'withdrawn':
      return 'danger';
  }
}

function roleTypeLabel(roleType: JdRecord['roleType']): string {
  switch (roleType) {
    case 'full-time':
      return 'Full-time';
    case 'vacation-internship':
      return 'Vacation internship';
    case 'during-course-internship':
      return 'During-course internship';
  }
}

function compLabel(jd: JdRecord): string {
  const rupees = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;
  if (jd.roleType === 'full-time') {
    if (jd.baseMinPaise && jd.baseMaxPaise) {
      return `${rupees(jd.baseMinPaise)}–${rupees(jd.baseMaxPaise)} / yr`;
    }
    return 'CTC range TBD';
  }
  return jd.stipendPaise ? `${rupees(jd.stipendPaise)} / mo` : 'stipend TBD';
}
