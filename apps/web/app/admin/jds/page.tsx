import type { Metadata } from 'next';
import { AdminShell, StatusPill, type StatusTone } from '@nid/ui';
import { listJdsByStatus, type JdRecord } from '@nid/module-jd-posting';

export const metadata: Metadata = {
  title: 'JD moderation · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function AdminJdsPage() {
  const inModeration = listJdsByStatus('in-moderation');
  const published = listJdsByStatus('published');

  return (
    <AdminShell activeNav="jds" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-8)' }}>
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
              Spring 2026 · {inModeration.length} awaiting moderation
            </p>
            <h1
              style={{
                fontSize: 'var(--fs-40)',
                lineHeight: 'var(--lh-48)',
                fontWeight: 'var(--fw-500)',
                color: 'var(--text-strong)',
              }}
            >
              JD moderation
            </h1>
            <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-primary)', marginTop: 'var(--space-3)', maxWidth: '720px' }}>
              Review submitted JDs, confirm the discipline mapping (the institution&rsquo;s translation from the
              recruiter&rsquo;s vocabulary to NID disciplines), and publish — or hold for clarification.
            </p>
          </header>

          <Group title="Awaiting moderation" jds={inModeration} emptyLabel="No JDs awaiting moderation." showReview />
          <Group title="Recently published" jds={published} emptyLabel="Nothing published yet." />
        </div>
      </section>
    </AdminShell>
  );
}

function Group({
  title,
  jds,
  emptyLabel,
  showReview,
}: {
  title: string;
  jds: readonly JdRecord[];
  emptyLabel: string;
  showReview?: boolean;
}) {
  return (
    <div style={{ marginBottom: 'var(--space-10)' }}>
      <h2
        style={{
          fontSize: 'var(--fs-12)',
          fontWeight: 'var(--fw-600)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--space-3)',
        }}
      >
        {title} ({jds.length})
      </h2>
      {jds.length === 0 ? (
        <p
          style={{
            fontSize: 'var(--fs-14)',
            color: 'var(--text-secondary)',
            padding: 'var(--space-6)',
            backgroundColor: 'var(--surface-card)',
            borderRadius: 'var(--card-radius)',
            border: '1px dashed var(--border-emphasized)',
          }}
        >
          {emptyLabel}
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {jds.map((jd) => (
            <article
              key={jd.id}
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
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                  <h3 style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                    {jd.title}
                  </h3>
                  <StatusPill tone={statusTone(jd.status)}>{statusLabel(jd.status)}</StatusPill>
                </div>
                <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
                  {roleTypeLabel(jd.roleType)} · {jd.location} · {jd.positions}{' '}
                  {jd.positions === 1 ? 'position' : 'positions'} · {jd.targetProgrammes.join(' + ') || 'no programmes'}
                </p>
              </div>
              {showReview && (
                <a
                  href={`/admin/jds/${jd.id}`}
                  style={{
                    alignSelf: 'center',
                    color: 'var(--accent)',
                    fontWeight: 'var(--fw-600)',
                    textDecoration: 'none',
                    fontSize: 'var(--fs-14)',
                  }}
                >
                  Review &amp; publish →
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function statusLabel(status: JdRecord['status']): string {
  return status === 'in-moderation' ? 'In moderation' : status === 'published' ? 'Published' : status;
}
function statusTone(status: JdRecord['status']): StatusTone {
  return status === 'in-moderation' ? 'warning' : status === 'published' ? 'success' : 'neutral';
}
function roleTypeLabel(roleType: JdRecord['roleType']): string {
  return roleType === 'full-time'
    ? 'Full-time'
    : roleType === 'vacation-internship'
      ? 'Vacation internship'
      : 'During-course internship';
}
