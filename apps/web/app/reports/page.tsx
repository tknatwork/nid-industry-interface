import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { REPORTS } from '~/lib/recruiter-public';

export const metadata: Metadata = {
  title: 'Placement reports · NID Industry Interface',
  description: 'Public placement statistics by cycle: students, offers, and CTC range.',
};

export default function ReportsPage() {
  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={kicker}>Transparency</p>
          <h1 style={h1}>Placement reports</h1>
          <p style={lede}>
            Aggregate outcomes from recent cycles. CTC figures are per-annum, in lakhs of rupees, across full-time
            offers; they describe the range, not a promise.
          </p>

          <div style={{ overflowX: 'auto', marginTop: 'var(--space-8)' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th scope="col" style={th}>Cycle</th>
                  <th scope="col" style={thNum}>Students</th>
                  <th scope="col" style={thNum}>Offers</th>
                  <th scope="col" style={thNum}>Highest CTC</th>
                  <th scope="col" style={thNum}>Lowest CTC</th>
                </tr>
              </thead>
              <tbody>
                {REPORTS.map((r) => (
                  <tr key={r.cycle}>
                    <th scope="row" style={rowHead}>{r.cycle}</th>
                    <td style={td}>{r.students}</td>
                    <td style={td}>{r.offers}</td>
                    <td style={td}>{r.highCtcLakh} LPA</td>
                    <td style={td}>{r.lowCtcLakh} LPA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '680px' };
const table = { width: '100%', borderCollapse: 'collapse' as const, backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' };
const th = { textAlign: 'left' as const, fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: 'var(--space-4)', borderBottom: '1px solid var(--border-emphasized)' };
const thNum = { ...th, textAlign: 'right' as const };
const rowHead = { textAlign: 'left' as const, fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', padding: 'var(--space-4)', borderBottom: '1px solid var(--border-default)' };
const td = { textAlign: 'right' as const, fontSize: 'var(--fs-16)', color: 'var(--text-primary)', padding: 'var(--space-4)', borderBottom: '1px solid var(--border-default)' };
