import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell } from '@nid/ui';
import { listForRecruiter } from '@nid/module-jd-posting';
import { listEligibleCandidates, type CandidateView } from '@nid/module-candidate-browse';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Candidates · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

const ACCENT: Record<CandidateView['accent'], string> = {
  red: 'var(--red-500)',
  yellow: 'var(--yellow-500)',
  cyan: 'var(--cyan-500)',
  green: 'var(--green-500)',
  purple: 'var(--purple-500)',
  navy: 'var(--navy-500)',
};

export default function CrossJdCandidatesPage() {
  const { recruiterId, cycleId, companyName } = DEMO_RECRUITER;
  const published = listForRecruiter(recruiterId).filter((jd) => jd.status === 'published');
  const disciplineIds = [...new Set(published.flatMap((jd) => jd.targetDisciplineIds))];

  // Union of eligible candidates across the recruiter's published JDs, deduped.
  const seen = new Set<string>();
  const candidates: CandidateView[] = [];
  if (disciplineIds.length > 0) {
    for (const c of listEligibleCandidates({ cycleId, targetDisciplineIds: disciplineIds, sort: 'discipline' })) {
      if (!seen.has(c.studentId)) {
        seen.add(c.studentId);
        candidates.push(c);
      }
    }
  }

  return (
    <RecruiterShell activeNav="candidates" companyName={companyName} accountMenu={<RecruiterAccountMenu companyName={companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Across your published JDs</p>
            <h1 style={h1}>Candidates</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Portfolio-first discovery across every discipline your published JDs target. Open-ended — no ranking,
              no fit-score. Shortlisting happens individually inside each JD.
            </p>
          </header>

          {candidates.length === 0 ? (
            <p style={notice}>
              No eligible candidates yet — publish a JD with confirmed target disciplines first.{' '}
              <a href="/recruiter/jds" style={accentLink}>Your JDs →</a>
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              {candidates.map((c) => (
                <article key={c.studentId} style={tile}>
                  <div style={{ height: '120px', borderRadius: 'var(--radius-2)', backgroundColor: ACCENT[c.accent], opacity: 0.18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.disciplineName}</span>
                  </div>
                  <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-2)' }}>{c.name}</p>
                  <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>{c.programme === 'masters' ? 'M.Des' : 'B.Des'} · {c.disciplineName} · {c.batchYear}</p>
                  <a href={c.portfolioUrl} target="_blank" rel="noreferrer noopener" style={{ ...accentLink, fontSize: 'var(--fs-12)' }}>Portfolio ({c.portfolioHost}) →</a>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const tile = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--space-3)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
const accentLink = { color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)', display: 'inline-block', marginTop: 'var(--space-1)' } as const;
