import type { Metadata } from 'next';
import { StudentShell } from '@nid/ui';
import { getStudentProfile } from '@nid/module-student-portal';
import { DEMO_STUDENT } from '~/lib/demo-student';

export const metadata: Metadata = {
  title: 'Your coordinator · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

const COORDINATOR = {
  name: 'Meher Kapadia',
  role: 'Student coordinator',
  cohort: 'Acme Design Studio cohort · Spring 2026',
  messageNote:
    'Drop a note here any time during the cycle — about a slot clash, an offer you’re unsure about, or anything that feels off. In-portal messaging lands in a later milestone; until then, your coordinator is reachable through the placement office.',
} as const;

const ESCALATION: ReadonlyArray<{ step: number; title: string; note: string }> = [
  { step: 1, title: 'Student coordinator', note: 'Your first point of contact for the day-to-day of this cycle.' },
  { step: 2, title: 'Faculty coordinator', note: 'Steps in when something needs an academic or policy call.' },
  { step: 3, title: 'Placement head', note: 'The final escalation for anything unresolved at the levels above.' },
];

export default function StudentCoordinatorPage() {
  const { studentId } = DEMO_STUDENT;
  const studentName = getStudentProfile(studentId)?.name ?? 'Student';

  return (
    <StudentShell studentName={studentName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Support</p>
            <h1 style={h1}>Your coordinator</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              You are never on your own in a cycle. Your assigned student coordinator runs your company cohort and
              is your first port of call.
            </p>
          </header>

          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{COORDINATOR.name}</p>
                <p style={{ ...label, marginTop: 'var(--space-1)' }}>{COORDINATOR.role}</p>
              </div>
            </div>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)' }}>
              Runs the <strong style={{ color: 'var(--text-strong)' }}>{COORDINATOR.cohort}</strong>.
            </p>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--radius-2)' }}>
              {COORDINATOR.messageNote}
            </p>
          </div>

          <div style={{ ...card, marginTop: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>Escalation path</p>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              If something can&apos;t be resolved at one level, it moves up to the next.
            </p>
            <ol style={{ listStyle: 'none', margin: 'var(--space-4) 0 0', padding: 0, display: 'grid', gap: 'var(--space-3)' }}>
              {ESCALATION.map((e) => (
                <li key={e.step} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                  <span style={stepBadge}>{e.step}</span>
                  <div>
                    <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{e.title}</p>
                    <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>{e.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </StudentShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '2px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const stepBadge = { flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.75em', height: '1.75em', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-on-accent)', backgroundColor: 'var(--accent)', borderRadius: 'var(--radius-2)' } as const;
