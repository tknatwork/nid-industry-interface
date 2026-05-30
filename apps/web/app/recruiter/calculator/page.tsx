import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell } from '@nid/ui';
import { StipendCalculator } from '~/components/StipendCalculator';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';

export const metadata: Metadata = {
  title: 'Stipend calculator · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function RecruiterCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ roleType?: string; programme?: string; dev?: string }>;
}) {
  const sp = await searchParams;
  return (
    <RecruiterShell companyName={DEMO_RECRUITER.companyName} accountMenu={<RecruiterAccountMenu companyName={DEMO_RECRUITER.companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Self-check before posting
            </p>
            <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' }}>
              Minimum-stipend calculator
            </h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              The same published formula the pre-publish gate enforces. <a href="/recruiter/jds/new" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)' }}>Continue to JD posting →</a>
            </p>
          </header>
          <StipendCalculator basePath="/recruiter/calculator" selection={sp} />
        </div>
      </section>
    </RecruiterShell>
  );
}
