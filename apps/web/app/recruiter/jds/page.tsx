import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import {
  RecruiterShell,
  Button,
  StatusPill,
  SidePanel,
  type StatusTone,
  type SidePanelSection,
} from '@nid/ui';
import { listForRecruiter, skillLabel, type JdRecord } from '@nid/module-jd-posting';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { discardDraftAction } from './actions';

export const metadata: Metadata = {
  title: 'Job descriptions · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

// ── Filter taxonomy (plan §M) ────────────────────────────────────────────────
// The rail segments by TYPE (Full-time vs Internship = vacation + during-course)
// and by STATUS (Drafts / In moderation / Published / Closed). Each facet is a
// `?filter=` value; `all` (or no param) shows everything.

type FilterId =
  | 'all'
  | 'full-time'
  | 'internship'
  | 'draft'
  | 'in-moderation'
  | 'published'
  | 'closed';

const FILTER_IDS: readonly FilterId[] = [
  'all',
  'full-time',
  'internship',
  'draft',
  'in-moderation',
  'published',
  'closed',
];

function isFilterId(value: string | undefined): value is FilterId {
  return value !== undefined && (FILTER_IDS as readonly string[]).includes(value);
}

function isInternship(jd: JdRecord): boolean {
  return jd.roleType === 'vacation-internship' || jd.roleType === 'during-course-internship';
}

function matchesFilter(jd: JdRecord, filter: FilterId): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'full-time':
      return jd.roleType === 'full-time';
    case 'internship':
      return isInternship(jd);
    case 'draft':
    case 'in-moderation':
    case 'published':
    case 'closed':
      return jd.status === filter;
  }
}

const FILTER_LABEL: Record<FilterId, string> = {
  all: 'All job descriptions',
  'full-time': 'Full-time roles',
  internship: 'Internships',
  draft: 'Drafts',
  'in-moderation': 'In moderation',
  published: 'Published',
  closed: 'Closed',
};

export default async function RecruiterJdsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const filter: FilterId = isFilterId(sp.filter) ? sp.filter : 'all';
  const error = sp.error;

  const jds = listForRecruiter(DEMO_RECRUITER.recruiterId);
  const visible = jds.filter((jd) => matchesFilter(jd, filter));

  const countFor = (id: FilterId) => jds.filter((jd) => matchesFilter(jd, id)).length;

  const sections: readonly SidePanelSection[] = [
    {
      id: 'type',
      label: 'Type',
      options: [
        { id: 'all', label: 'All', href: '/recruiter/jds', count: jds.length, active: filter === 'all' },
        {
          id: 'full-time',
          label: 'Full-time',
          href: '/recruiter/jds?filter=full-time',
          count: countFor('full-time'),
          active: filter === 'full-time',
          disabled: countFor('full-time') === 0,
        },
        {
          id: 'internship',
          label: 'Internship',
          href: '/recruiter/jds?filter=internship',
          count: countFor('internship'),
          active: filter === 'internship',
          disabled: countFor('internship') === 0,
        },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      options: (['draft', 'in-moderation', 'published', 'closed'] as const).map((id) => ({
        id,
        label: statusLabel(id),
        href: `/recruiter/jds?filter=${id}`,
        count: countFor(id),
        active: filter === id,
        disabled: countFor(id) === 0,
      })),
    },
  ];

  const railHeader =
    filter === 'all' ? undefined : (
      <a
        href="/recruiter/jds"
        style={{
          fontSize: 'var(--fs-12)',
          fontWeight: 'var(--fw-600)',
          color: 'var(--accent)',
          textDecoration: 'none',
        }}
      >
        ← Clear filter
      </a>
    );

  return (
    <RecruiterShell activeNav="jds" companyName={DEMO_RECRUITER.companyName} accountMenu={<RecruiterAccountMenu companyName={DEMO_RECRUITER.companyName} />}>
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
                {visible.length} {visible.length === 1 ? 'job description' : 'job descriptions'}
                {filter !== 'all' ? ` · ${FILTER_LABEL[filter]}` : ''}
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

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: 'var(--space-6)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-2)',
                backgroundColor: 'var(--pill-danger-bg)',
                color: 'var(--pill-danger-fg)',
                fontSize: 'var(--fs-14)',
              }}
            >
              {error}
            </div>
          )}

          {jds.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(200px, 240px) minmax(0, 1fr)',
                gap: 'var(--space-6)',
                alignItems: 'start',
              }}
            >
              <div style={{ position: 'sticky', top: 'var(--space-6)' }}>
                <SidePanel sections={sections} ariaLabel="Filter job descriptions" header={railHeader} />
              </div>

              {visible.length === 0 ? (
                <FilteredEmptyState filter={filter} />
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  {visible.map((jd) => (
                    <JdCard key={jd.id} jd={jd} />
                  ))}
                </div>
              )}
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

function FilteredEmptyState({ filter }: { filter: FilterId }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px dashed var(--border-emphasized)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--space-10)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-strong)', marginBottom: 'var(--space-2)' }}>
        No JDs match “{FILTER_LABEL[filter]}”
      </p>
      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
        <a href="/recruiter/jds" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Clear the filter
        </a>{' '}
        to see all of your job descriptions.
      </p>
    </div>
  );
}

function JdCard({ jd }: { jd: JdRecord }) {
  const isDraft = jd.status === 'draft';
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
        {isDraft && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'center',
              marginTop: 'var(--space-4)',
            }}
          >
            <a
              href={`/recruiter/jds/${jd.id}/edit`}
              style={{
                color: 'var(--accent)',
                fontWeight: 'var(--fw-600)',
                fontSize: 'var(--fs-14)',
                textDecoration: 'none',
              }}
            >
              Edit draft →
            </a>
            <form action={discardDraftAction}>
              <input type="hidden" name="jdId" value={jd.id} />
              <button
                type="submit"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--ff-sans)',
                  fontSize: 'var(--fs-14)',
                  fontWeight: 'var(--fw-600)',
                  color: 'var(--pill-danger-fg)',
                  textDecoration: 'none',
                }}
              >
                Discard
              </button>
            </form>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
        <p>{compLabel(jd)}</p>
        <p style={{ marginTop: 'var(--space-1)' }}>{jd.interviewRounds.length} interview rounds</p>
        {jd.status === 'published' && (
          <a
            href={`/recruiter/jds/${jd.id}/applicants`}
            style={{
              display: 'inline-block',
              marginTop: 'var(--space-3)',
              color: 'var(--accent)',
              fontWeight: 'var(--fw-600)',
              fontSize: 'var(--fs-14)',
              textDecoration: 'none',
            }}
          >
            View applicants →
          </a>
        )}
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
