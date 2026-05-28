import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudentShell, StatusPill, Button } from '@nid/ui';
import { getStudentProfile, isOptedIn } from '@nid/module-student-portal';
import { DEMO_STUDENT } from '~/lib/demo-student';
import { toggleOptInAction } from './actions';

export const metadata: Metadata = {
  title: 'Cycles · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function StudentCyclesPage() {
  const { studentId, cycleId, cycleName } = DEMO_STUDENT;
  const profile = getStudentProfile(studentId);
  if (!profile) notFound();
  const optedIn = isOptedIn(studentId, cycleId);

  return (
    <StudentShell activeNav="cycles" studentName={profile.name}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Participation</p>
            <h1 style={h1}>Cycles</h1>
            <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Opting in is your choice — the institution does not place you automatically, and opting in is
              not a commitment to accept any offer.
            </p>
          </header>

          <div style={{ ...card, borderColor: optedIn ? 'var(--accent)' : 'var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{cycleName}</p>
                <p style={{ ...label, marginTop: 'var(--space-1)' }}>Open cycle · {profile.disciplineName}</p>
              </div>
              {optedIn ? <StatusPill tone="success">Opted in</StatusPill> : <StatusPill tone="neutral">Not opted in</StatusPill>}
            </div>

            <ul style={{ margin: 'var(--space-4) 0', paddingLeft: 'var(--space-5)', color: 'var(--text-secondary)', fontSize: 'var(--fs-14)', display: 'grid', gap: 'var(--space-1)' }}>
              <li>While opted in, recruiters in your discipline can see your profile and shortlist you.</li>
              <li>You can opt out any time before a recruiter shortlists you for an opening.</li>
              <li>Opting out hides your eligible-openings feed and removes you from new browse results.</li>
            </ul>

            <form action={toggleOptInAction}>
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="cycleId" value={cycleId} />
              <input type="hidden" name="optedIn" value={optedIn ? 'false' : 'true'} />
              <Button type="submit" variant={optedIn ? 'ghost' : 'primary'}>
                {optedIn ? `Opt out of ${cycleName}` : `Opt in to ${cycleName}`}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </StudentShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '2px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
