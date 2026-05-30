import type { Metadata } from 'next';
import { AdminShell, StatusPill } from '@nid/ui';
import { DEMO_COORDINATOR, resolveAdminRole } from '~/lib/demo-coordinator';
import { CoordinatorScopeBanner } from '~/components/CoordinatorScopeBanner';
import { assignedCompanyViews, coordinatorDisplayName, coordinatorShellProps, type CoordinatorCompany } from './_data';

export const metadata: Metadata = {
  title: 'My companies · Coordinator · NID Industry Interface',
  robots: { index: false, follow: false },
};

/**
 * Student-coordinator landing (plan §Q surface (a)): the assigned-companies
 * dashboard. Scoped strictly to `DEMO_COORDINATOR.assignedCompanies` — the
 * read model filters everything else out before it reaches this page.
 */
export default function CoordinatorHome() {
  const role = resolveAdminRole();
  const companies = assignedCompanyViews(role);
  const coordinatorName = coordinatorDisplayName();

  const totalSelected = companies.reduce((n, c) => n + c.selectedCount, 0);
  const totalBooked = companies.reduce((n, c) => n + c.bookedCount, 0);

  return (
    <AdminShell {...coordinatorShellProps(role)} activeNav="coordinator-companies">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={eyebrow}>Interview-day coordination</p>
            <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
              My companies
            </h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', maxWidth: '64ch' }}>
              The companies the placement cell has assigned to you for this cycle. Open a company to
              see its selected students, booked slots, and the round-progress editor — your updates
              surface on the recruiter&rsquo;s interview console.
            </p>
          </header>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <CoordinatorScopeBanner coordinatorName={coordinatorName} campus={DEMO_COORDINATOR.campus} companyCount={companies.length} />
          </div>

          {/* Cohort summary across assigned companies. */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
            <Stat label="Assigned companies" value={String(companies.length)} />
            <Stat label="Selected students" value={String(totalSelected)} />
            <Stat label="Slots booked" value={`${totalBooked} / ${totalSelected}`} />
          </div>

          {companies.length === 0 ? (
            <Notice>No companies are assigned to you for the current cycle.</Notice>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {companies.map((c) => (
                <CompanyCard key={c.recruiterId} company={c} />
              ))}
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function CompanyCard({ company }: { company: CoordinatorCompany }) {
  const jdCount = company.jds.length;
  return (
    <a
      href={`/admin/coordinator/${encodeURIComponent(company.recruiterId)}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        transition: 'border-color var(--motion-micro)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <p style={eyebrow}>{company.recruiterId}</p>
          <h2 style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
            {company.company}
          </h2>
          <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            {jdCount === 1 ? '1 published JD' : `${jdCount} published JDs`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <StatusPill tone="info">{company.selectedCount} selected</StatusPill>
          <StatusPill tone={company.bookedCount === company.selectedCount && company.selectedCount > 0 ? 'success' : 'neutral'}>
            {company.bookedCount} booked
          </StatusPill>
          <span aria-hidden style={{ fontSize: 'var(--fs-20)', color: 'var(--accent)' }}>→</span>
        </div>
      </div>
    </a>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: '1 1 160px',
        backgroundColor: 'var(--surface-panel)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-3)',
        padding: 'var(--space-4)',
      }}
    >
      <p style={{ fontSize: 'var(--fs-28)', fontWeight: 'var(--fw-700)', color: 'var(--text-strong)' }}>{value}</p>
      <p style={eyebrow}>{label}</p>
    </div>
  );
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
