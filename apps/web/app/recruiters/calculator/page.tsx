import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';
import { StipendCalculator } from '~/components/StipendCalculator';

export const metadata: Metadata = {
  title: 'Stipend calculator · NID Industry Interface',
  description: 'Self-check the minimum stipend for a role before you apply to recruit at NID.',
};

export default async function PublicCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ roleType?: string; programme?: string; dev?: string }>;
}) {
  const sp = await searchParams;
  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
            Before you apply
          </p>
          <h1 style={{ fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>
            Minimum-stipend calculator
          </h1>
          <p style={{ fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '640px', marginBottom: 'var(--space-8)' }}>
            NID publishes its compensation floors. Roles that bundle engineering work onto a design brief carry a
            higher floor (the scope-creep guard). Check yours here — there is no black-box rejection at submission.
          </p>
          <StipendCalculator basePath="/recruiters/calculator" selection={sp} />
        </div>
      </section>
    </PageShell>
  );
}
