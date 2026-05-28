import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecruiterShell, StatusPill } from '@nid/ui';
import { getJd } from '@nid/module-jd-posting';
import {
  listEligibleCandidates,
  listShortlist,
  isShortlisted,
  type CandidateSort,
  type CandidateView,
} from '@nid/module-candidate-browse';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Applicants · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

interface PageParams {
  readonly jdId: string;
}
interface SearchParams {
  readonly sort?: string;
}

const SORTS: ReadonlyArray<{ key: CandidateSort; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'batch', label: 'Batch' },
];

export default async function ApplicantsPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { jdId } = await params;
  const jd = getJd(jdId);
  if (!jd) notFound();

  const sortParam = (await searchParams).sort;
  const sort: CandidateSort = sortParam === 'discipline' || sortParam === 'batch' ? sortParam : 'name';

  const candidates =
    jd.status === 'published'
      ? listEligibleCandidates({ cycleId: jd.cycleId, targetDisciplineIds: jd.targetDisciplineIds, sort })
      : [];
  const shortlistedIds = new Set(listShortlist(jdId).map((s) => s.candidate.studentId));

  return (
    <RecruiterShell activeNav="jds" companyName={DEMO_RECRUITER.companyName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <a href="/recruiter/jds" style={backLink}>
            ← Your JDs
          </a>

          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div>
              <p style={metaLabel}>{jd.title} · applicants</p>
              <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                {candidates.length} eligible {candidates.length === 1 ? 'candidate' : 'candidates'}
              </h1>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Showing students in this JD&rsquo;s confirmed disciplines who opted into Spring 2026 ·{' '}
                {shortlistedIds.size} shortlisted
              </p>
            </div>
            {jd.status === 'published' && candidates.length > 0 && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Sort
                </span>
                {SORTS.map((s) => (
                  <a
                    key={s.key}
                    href={`/recruiter/jds/${jdId}/applicants?sort=${s.key}`}
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--fs-12)',
                      fontWeight: 'var(--fw-600)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      textDecoration: 'none',
                      backgroundColor: sort === s.key ? 'var(--accent)' : 'var(--surface-panel)',
                      color: sort === s.key ? 'var(--text-on-accent)' : 'var(--text-primary)',
                    }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </header>

          {jd.status !== 'published' ? (
            <Notice>
              This JD is <strong>{jd.status}</strong>. Applicants appear once it&rsquo;s published by the placement cell.
            </Notice>
          ) : candidates.length === 0 ? (
            <Notice>No eligible candidates yet for this JD&rsquo;s disciplines this cycle.</Notice>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {candidates.map((c) => (
                <CandidateTile key={c.studentId} jdId={jdId} candidate={c} shortlisted={shortlistedIds.has(c.studentId)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

function CandidateTile({ jdId, candidate, shortlisted }: { jdId: string; candidate: CandidateView; shortlisted: boolean }) {
  return (
    <a
      href={`/recruiter/jds/${jdId}/applicants/${candidate.studentId}`}
      data-discipline={disciplineTheme(candidate.accent)}
      style={{
        display: 'block',
        textDecoration: 'none',
        backgroundColor: 'var(--card-bg)',
        borderRadius: 'var(--card-radius)',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow)',
        border: '1px solid var(--card-border)',
      }}
    >
      {/* Portfolio-first: discipline-colored placeholder until the ingest pipeline supplies real thumbnails */}
      <div
        style={{
          aspectRatio: '4 / 3',
          backgroundColor: `var(--accent)`,
          display: 'flex',
          alignItems: 'flex-end',
          padding: 'var(--space-3)',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontSize: 'var(--fs-12)',
            fontWeight: 'var(--fw-600)',
            color: 'var(--text-on-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            opacity: 0.9,
          }}
        >
          Portfolio · {candidate.portfolioHost}
        </span>
        {shortlisted && (
          <span
            style={{
              position: 'absolute',
              top: 'var(--space-2)',
              right: 'var(--space-2)',
            }}
          >
            <StatusPill tone="success">Shortlisted</StatusPill>
          </span>
        )}
      </div>
      <div style={{ padding: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
          {candidate.name}
        </p>
        <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
          {candidate.disciplineName}
        </p>
        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
          {candidate.programme === 'masters' ? 'M.Des' : 'B.Des'} · batch {candidate.batchYear}
        </p>
      </div>
    </a>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 'var(--fs-14)',
        color: 'var(--text-secondary)',
        padding: 'var(--space-8)',
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--card-radius)',
        border: '1px dashed var(--border-emphasized)',
        textAlign: 'center',
      }}
    >
      {children}
    </p>
  );
}

const metaLabel = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};
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
