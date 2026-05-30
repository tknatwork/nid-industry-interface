import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell, StatusPill } from '@nid/ui';
import { listForRecruiter } from '@nid/module-jd-posting';
import { tallyFor } from '@nid/module-offer-cascade';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Offers · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default function OffersLauncher() {
  const { recruiterId, companyName } = DEMO_RECRUITER;
  const jds = listForRecruiter(recruiterId).filter((jd) => jd.status === 'published');

  return (
    <RecruiterShell activeNav="offers" companyName={companyName} accountMenu={<RecruiterAccountMenu companyName={companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Wave-based, strict 1:1 to positions</p>
            <h1 style={h1}>Offers</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Open a JD&apos;s offer board to float waves, track live acceptance, and cascade to the next-ranked
              shortlist when a student declines.
            </p>
          </header>

          {jds.length === 0 ? (
            <p style={notice}>No published JDs yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {jds.map((jd) => {
                const t = tallyFor(jd.id, jd.positions);
                return (
                  <a key={jd.id} href={`/recruiter/jds/${jd.id}/offers`} style={rowCard}>
                    <div>
                      <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{jd.title}</p>
                      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
                        {jd.positions} position{jd.positions === 1 ? '' : 's'} · {t.outstanding} outstanding · {t.declined} declined
                      </p>
                    </div>
                    <StatusPill tone={t.filled >= t.positions ? 'success' : t.outstanding > 0 ? 'info' : 'neutral'}>
                      {t.filled} / {t.positions} filled
                    </StatusPill>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const rowCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--space-4) var(--card-padding)', textDecoration: 'none' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
