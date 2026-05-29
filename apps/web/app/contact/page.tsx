import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';

export const metadata: Metadata = {
  title: 'Contact · NID Industry Interface',
  description: 'How to reach the NID placement cell.',
};

export default function ContactIndexPage() {
  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <p style={kicker}>One inbound channel, routed by stage</p>
          <h1 style={h1}>Contact</h1>
          <p style={lede}>
            All recruiter messages route through a single channel and fan out internally by stage. Self-serve the
            right contact below — no phoning personal numbers.
          </p>
          <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
            <a href="/contact/placement-heads" style={card}>
              <h2 style={cardTitle}>Placement heads →</h2>
              <p style={cardBody}>One human contact per campus — pre-cycle planning, escalations, scheduled meetings.</p>
            </a>
            <a href="/contact/coordinators" style={card}>
              <h2 style={cardTitle}>Student coordinators + escalation tree →</h2>
              <p style={cardBody}>Per-campus coordinators and the documented escalation path, student coordinator → director.</p>
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '620px' };
const card = { display: 'block', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)', borderTop: '3px solid var(--accent)', textDecoration: 'none' } as const;
const cardTitle = { fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' };
const cardBody = { fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-18)', fontWeight: 'var(--fw-300)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' };
