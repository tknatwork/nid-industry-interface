import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { redirect } from 'next/navigation';
import { RecruiterShell } from '@nid/ui';
import {
  isAccountLocked,
  getCompanyRecord,
} from '@nid/module-recruiter-onboarding';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { CYCLES, type Cycle } from '~/lib/public-content';
import { ReactivateForm } from './ReactivateForm';

export const metadata: Metadata = {
  title: 'Reactivate · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

/** Participation fee for re-activation, in paise (₹15,000). */
const REACTIVATION_FEE_PAISE = 1_500_000;

/**
 * The next placement cycle a locked recruiter re-pays into: the `upcoming`
 * entry in CYCLES (Autumn 2026 today), else the first current cycle as a floor
 * so the screen always resolves a target.
 */
function nextCycle(): Cycle {
  return CYCLES.find((c) => c.status === 'upcoming') ?? CYCLES[0]!;
}

/**
 * Internal cycle id for the activation store, derived from the public slug the
 * same way the seed does (`spring-2026` → `cycle_spring_2026`). The account
 * record keys on this id, not the public slug.
 */
function cycleIdFromSlug(slug: string): string {
  return `cycle_${slug.replace(/-/g, '_')}`;
}

export default async function RecruiterReactivate() {
  const recruiter = await readRecruiterSession();

  // Already unlocked → nothing to pay. Send them straight to the dashboard.
  if (!isAccountLocked(recruiter.recruiterId)) {
    redirect('/recruiter/dashboard');
  }

  const cycle = nextCycle();
  const nextCycleId = cycleIdFromSlug(cycle.slug);

  // Where the receipt confirms it was "sent" — the recruiter's own corporate
  // email + primary phone from their onboarding record (recruiterId === ticketId).
  const record = getCompanyRecord(recruiter.recruiterId);
  const sentToEmail = record?.corporateEmail ?? 'your corporate email';
  const sentToPhone = record?.contactPhone ?? 'your registered phone';

  return (
    <RecruiterShell
      activeNav="dashboard"
      companyName={recruiter.companyName}
      accountMenu={<RecruiterAccountMenu companyName={recruiter.companyName} />}
    >
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={kickerStyle}>Reactivate your account</p>
          <h1 style={titleStyle}>Pay the {cycle.label} participation fee</h1>
          <p style={leadStyle}>
            The previous placement cycle has closed, so your dashboard is locked. Your company details are
            kept on file — pay the {cycle.label} participation fee to reactivate. Your existing login does
            not change.
          </p>

          <div style={cardStyle}>
            <ReactivateForm
              recruiterId={recruiter.recruiterId}
              nextCycleId={nextCycleId}
              nextCycleLabel={cycle.label}
              amountPaise={REACTIVATION_FEE_PAISE}
              sentToEmail={sentToEmail}
              sentToPhone={sentToPhone}
            />
          </div>
        </div>
      </section>
    </RecruiterShell>
  );
}

// ── Styles (tokens only) ─────────────────────────────────────────────────────

const kickerStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-3)',
};

const titleStyle: CSSProperties = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-4)',
};

const leadStyle: CSSProperties = {
  fontSize: 'var(--fs-18)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-8)',
};

const cardStyle: CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding-loose)',
  boxShadow: 'var(--card-shadow)',
  border: '1px solid var(--card-border)',
};
