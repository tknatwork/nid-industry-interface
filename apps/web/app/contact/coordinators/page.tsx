import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { COORDINATORS, ESCALATION } from '~/lib/recruiter-public';

export const metadata: Metadata = {
  title: 'Student coordinators · NID Industry Interface',
  description: 'Per-campus student-coordinator directory and the escalation chain for unresolved concerns.',
};

export default function CoordinatorsPage() {
  return (
    <PageShell activeNav="contact">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <p style={kicker}>Contact</p>
          <h1 style={h1}>Student coordinators</h1>
          <p style={lede}>
            Each campus runs the cycle through student coordinators, each assigned to a recruiting company. They are your
            first point of contact for scheduling, logistics, and day-of-interview questions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            {COORDINATORS.map((c) => (
              <div key={c.campus} style={card}>
                <h2 style={cardTitle}>{c.campus}</h2>
                <ul style={{ listStyle: 'none', margin: 'var(--space-3) 0 0', padding: 0, display: 'grid', gap: 'var(--space-3)' }}>
                  {c.coordinators.map((co) => (
                    <li key={co.name} style={coRow}>
                      <span style={coName}>{co.name}</span>
                      <span style={coCompany}>{co.company}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 style={h2}>Escalation chain</h2>
          <p style={{ fontSize: 'var(--fs-16)', lineHeight: 'var(--lh-30)', color: 'var(--text-primary)', marginTop: 'var(--space-2)', maxWidth: '680px' }}>
            If a concern is not resolved at one level, it moves up the chain. Start with your student coordinator.
          </p>
          <ol style={{ listStyle: 'none', margin: 'var(--space-4) 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
            {ESCALATION.map((level, i) => (
              <li key={level} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={escNode}>
                  <span style={escIndex}>{i + 1}</span>
                  {level}
                </span>
                {i < ESCALATION.length - 1 && <span aria-hidden="true" style={escArrow}>→</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </PageShell>
  );
}

const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const h2 = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-12)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '720px' };
const card = { backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)' } as const;
const cardTitle = { fontSize: 'var(--fs-20)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const coRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-3)', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' } as const;
const coName = { fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const coCompany = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', textAlign: 'right' as const };
const escNode = { display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', backgroundColor: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: 'var(--space-2) var(--space-4)' } as const;
const escIndex = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'var(--space-5)', height: 'var(--space-5)', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--accent)', color: 'var(--surface-card)', fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)' } as const;
const escArrow = { color: 'var(--text-secondary)', fontSize: 'var(--fs-18)' } as const;
