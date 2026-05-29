import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { FAQ } from '~/lib/recruiter-public';

export const metadata: Metadata = {
  title: 'Recruiter FAQ · NID Industry Interface',
  description: 'Quick answers on fees, eligibility, stipend floors, lateral hiring, and contacting the placement office.',
};

export default function FaqPage() {
  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <a href="/recruiters" style={back}>← For recruiters</a>
          <p style={kicker}>Quick answers</p>
          <h1 style={h1}>Frequently asked questions</h1>
          <p style={lede}>
            The questions recruiters ask most. Still unsure? The placement office and per-campus coordinators are listed
            under Contact.
          </p>

          <dl style={{ display: 'grid', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            {FAQ.map((f) => (
              <div key={f.q} style={item}>
                <dt style={question}>{f.q}</dt>
                <dd style={answer}>{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </PageShell>
  );
}

const back = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '680px' };
const item = { backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)' } as const;
const question = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' };
const answer = { fontSize: 'var(--fs-16)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', marginTop: 'var(--space-2)', marginInlineStart: 0 };
