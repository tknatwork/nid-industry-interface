import type { Metadata } from 'next';
import { AdminShell, StatusPill, type StatusTone } from '@nid/ui';
import type { Attendance } from '@nid/module-interview-console';
import { resolveAdminRole } from '~/lib/demo-coordinator';
import { assignedCompanyViews, coordinatorShellProps, type CoordinatorCandidate } from '../_data';

export const metadata: Metadata = {
  title: 'Interviews · Coordinator · NID Industry Interface',
  robots: { index: false, follow: false },
};

const ATTENDANCE_LABEL: Record<Attendance, string> = {
  expected: 'Expected',
  arrived: 'Arrived',
  'in-interview': 'In interview',
  done: 'Done',
};
const ATTENDANCE_TONE: Record<Attendance, StatusTone> = {
  expected: 'neutral',
  arrived: 'info',
  'in-interview': 'success',
  done: 'neutral',
};

interface Row {
  readonly recruiterId: string;
  readonly company: string;
  readonly jdTitle: string;
  readonly c: CoordinatorCandidate;
}

/**
 * Coordinator interviews board (plan §Q nav surface): a cross-company,
 * slot-ordered view of every selected candidate across the coordinator's
 * assigned companies — who is where, when, and their live attendance signal.
 * A read-only situational board; the editing happens on each company page.
 * Scoped to assigned companies only (read model filters the rest).
 */
export default function CoordinatorInterviewsPage() {
  const role = resolveAdminRole();
  const companies = assignedCompanyViews(role);

  const rows: Row[] = companies.flatMap((co) =>
    co.jds.flatMap((cj) =>
      cj.candidates.map((c) => ({ recruiterId: co.recruiterId, company: co.company, jdTitle: cj.jd.title, c })),
    ),
  );

  // Slot-ordered (booked first, by day+time); unbooked candidates sort last.
  rows.sort((a, b) => {
    const ax = a.c.slot ? `${a.c.slot.day} ${a.c.slot.startTime}` : '~';
    const bx = b.c.slot ? `${b.c.slot.day} ${b.c.slot.startTime}` : '~';
    return ax.localeCompare(bx) || a.c.candidate.name.localeCompare(b.c.candidate.name);
  });

  return (
    <AdminShell {...coordinatorShellProps(role)} activeNav="coordinator-interviews">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={eyebrow}>Across your assigned companies</p>
            <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
              Interviews board
            </h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', maxWidth: '64ch' }}>
              Every selected candidate&rsquo;s slot and live attendance, ordered by interview time.
              Open a company to record round outcomes or update coordination signals.
            </p>
          </header>

          {rows.length === 0 ? (
            <Notice>No selected candidates across your assigned companies yet.</Notice>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {rows.map((r) => (
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
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)' }}>
                      {r.c.slot ? `${slotDate(r.c.slot.day)} · ${r.c.slot.startTime}` : 'No slot'}
                    </span>
                    {r.c.progress.coordination.inAnotherInterview && (
                      <StatusPill tone="warning">
                        another interview{r.c.progress.coordination.etaBack ? ` · ETA ${r.c.progress.coordination.etaBack}` : ''}
                      </StatusPill>
                    )}
                    <StatusPill tone={ATTENDANCE_TONE[r.c.progress.coordination.attendance]}>
                      {ATTENDANCE_LABEL[r.c.progress.coordination.attendance]}
                    </StatusPill>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function slotDate(day: string): string {
  return new Date(day + 'T00:00:00Z').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' });
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
