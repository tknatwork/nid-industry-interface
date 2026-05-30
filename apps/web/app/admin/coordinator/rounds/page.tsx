import type { Metadata } from 'next';
import { AdminShell, StatusPill, type StatusTone } from '@nid/ui';
import type { CandidateDecision } from '@nid/module-interview-console';
import { resolveAdminRole } from '~/lib/demo-coordinator';
import { assignedCompanyViews, coordinatorShellProps, type CoordinatorCandidate } from '../_data';

export const metadata: Metadata = {
  title: 'Round progress · Coordinator · NID Industry Interface',
  robots: { index: false, follow: false },
};

const DECISION_TONE: Record<CandidateDecision, StatusTone> = {
  selected: 'success',
  rejected: 'danger',
  pending: 'neutral',
};

interface Row {
  readonly recruiterId: string;
  readonly company: string;
  readonly jdTitle: string;
  readonly totalRounds: number;
  readonly c: CoordinatorCandidate;
}

/**
 * Coordinator round-progress board (plan §Q nav surface): every assigned
 * company's selected candidates with their current round and live decision —
 * the at-a-glance complement to the per-company round editor. Read-only;
 * editing happens on each company page. Scoped to assigned companies only.
 */
export default function CoordinatorRoundsPage() {
  const role = resolveAdminRole();
  const companies = assignedCompanyViews(role);

  const rows: Row[] = companies.flatMap((co) =>
    co.jds.flatMap((cj) =>
      cj.candidates.map((c) => ({
        recruiterId: co.recruiterId,
        company: co.company,
        jdTitle: cj.jd.title,
        totalRounds: Math.max(cj.jd.interviewRounds.length, 1),
        c,
      })),
    ),
  );

  rows.sort(
    (a, b) =>
      a.company.localeCompare(b.company) ||
      a.jdTitle.localeCompare(b.jdTitle) ||
      a.c.candidate.name.localeCompare(b.c.candidate.name),
  );

  return (
    <AdminShell {...coordinatorShellProps(role)} activeNav="coordinator-rounds">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={eyebrow}>Across your assigned companies</p>
            <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
              Round progress
            </h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', maxWidth: '64ch' }}>
              Current round and decision for every selected candidate. The numbers update as you
              record outcomes — and so does the recruiter&rsquo;s console, from the same shared store.
            </p>
          </header>

          {rows.length === 0 ? (
            <Notice>No selected candidates across your assigned companies yet.</Notice>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {rows.map((r) => {
                const round = Math.max(r.c.progress.currentRound, 0);
                const lastNote = r.c.progress.perRound.at(-1)?.note;
                return (
                  <a
                    key={`${r.recruiterId}-${r.c.candidate.studentId}`}
                    href={`/admin/coordinator/${encodeURIComponent(r.recruiterId)}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 'var(--space-4)',
                      flexWrap: 'wrap',
                      textDecoration: 'none',
                      backgroundColor: 'var(--surface-card)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 'var(--radius-3)',
                      padding: 'var(--space-3) var(--space-4)',
                    }}
                  >
                    <div style={{ minWidth: '220px' }}>
                      <p style={{ fontSize: 'var(--fs-15)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                        {r.c.candidate.name}
                      </p>
                      <p style={eyebrow}>{r.company} · {r.jdTitle}</p>
                      {lastNote && (
                        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 'var(--space-1)' }}>
                          {lastNote}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)' }}>
                        Round {round} of {r.totalRounds}
                      </span>
                      <StatusPill tone={DECISION_TONE[r.c.progress.decision]}>{r.c.progress.decision}</StatusPill>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-8)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--card-radius)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' }}>
      {children}
    </p>
  );
}

const eyebrow = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
};
