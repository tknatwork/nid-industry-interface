import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell, StatusPill, Button } from '@nid/ui';
import { DEMO_COORDINATOR, resolveAdminRole } from '~/lib/demo-coordinator';
import { CoordinatorScopeBanner } from '~/components/CoordinatorScopeBanner';
import { CoordinatorRoundEditor } from '~/components/CoordinatorRoundEditor';
import { companyView, coordinatorDisplayName, coordinatorShellProps, type CoordinatorCandidate, type CoordinatorJd } from '../_data';
import { recordRoundOutcomeAction, setCoordinationSignalAction } from './actions';

export const metadata: Metadata = {
  title: 'Company coordination · Coordinator · NID Industry Interface',
  robots: { index: false, follow: false },
};

/**
 * Per-company coordination surface (plan §Q surfaces (b) + (c)): one assigned
 * company's published JDs → its selected students, each candidate's booked slot
 * + expected interviewers, and the round-progress editor where the coordinator
 * records outcomes and sets coordination signals. Out-of-scope companies hit
 * `notFound()` — `companyView` returns null for anything outside the
 * coordinator's `assignedCompanies` (the §Q deny rule, enforced at the page).
 */
export default async function CoordinatorCompanyPage({ params }: { params: Promise<{ recruiterId: string }> }) {
  const { recruiterId: raw } = await params;
  const recruiterId = decodeURIComponent(raw);
  const role = resolveAdminRole();

  const view = companyView(recruiterId, role);
  if (!view) notFound();

  const coordinatorName = coordinatorDisplayName();

  return (
    <AdminShell {...coordinatorShellProps(role)} activeNav="coordinator-companies">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <a href="/admin/coordinator" style={backLink}>← My companies</a>

          <header style={{ marginBottom: 'var(--space-5)' }}>
            <p style={eyebrow}>{view.recruiterId} · interview coordination</p>
            <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
              {view.company}
            </h1>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
              <StatusPill tone="info">{view.selectedCount} selected</StatusPill>
              <StatusPill tone={view.bookedCount === view.selectedCount && view.selectedCount > 0 ? 'success' : 'neutral'}>
                {view.bookedCount} / {view.selectedCount} slots booked
              </StatusPill>
            </div>
          </header>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <CoordinatorScopeBanner coordinatorName={coordinatorName} campus={DEMO_COORDINATOR.campus} companyCount={1} />
          </div>

          {/* Surface (c): student-side coordination — contact the assigned cohort. */}
          <CohortContactCard companyName={view.company} cohortSize={view.selectedCount} coordinatorName={coordinatorName} />

          {view.jds.length === 0 ? (
            <Notice>This company has no published JDs in the current cycle yet.</Notice>
          ) : (
            view.jds.map((cj) => <JdSection key={cj.jd.id} recruiterId={view.recruiterId} cj={cj} />)
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function JdSection({ recruiterId, cj }: { recruiterId: string; cj: CoordinatorJd }) {
  const totalRounds = Math.max(cj.jd.interviewRounds.length, 1);
  return (
    <div style={{ marginTop: 'var(--space-8)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <div>
          <p style={eyebrow}>JD {cj.jd.id} · {cj.jd.positions === 1 ? '1 position' : `${cj.jd.positions} positions`}</p>
          <h2 style={{ fontSize: 'var(--fs-28)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{cj.jd.title}</h2>
        </div>
        <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)' }}>
          {cj.jd.interviewRounds.length === 0
            ? 'No rounds declared'
            : cj.jd.interviewRounds.map((r) => `R${r.round} ${r.focus}`).join(' · ')}
        </p>
      </div>

      {cj.candidates.length === 0 ? (
        <Notice>No students have been selected for this JD yet.</Notice>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          {cj.candidates.map((c) => (
            <CandidateBlock key={c.candidate.studentId} recruiterId={recruiterId} jdId={cj.jd.id} totalRounds={totalRounds} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateBlock({
  recruiterId,
  jdId,
  totalRounds,
  c,
}: {
  recruiterId: string;
  jdId: string;
  totalRounds: number;
  c: CoordinatorCandidate;
}) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      {/* Booked slot + expected interviewers (read-only; recruiter owns booking). */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          backgroundColor: 'var(--surface-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-3)',
          padding: 'var(--space-3) var(--space-4)',
        }}
      >
        <div>
          <p style={{ fontSize: 'var(--fs-15)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
            {c.candidate.name} · <span style={{ color: 'var(--text-secondary)', fontWeight: 'var(--fw-400)' }}>{c.candidate.disciplineName}</span>
          </p>
          <p style={eyebrow}>
            {c.slot
              ? `${slotDate(c.slot.day)} · ${c.slot.startTime}–${c.slot.endTime}`
              : 'No slot booked by the recruiter yet'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={eyebrow}>Expected interviewers</p>
          <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)' }}>
            {c.interviewers.length > 0 ? c.interviewers.join(', ') : 'Not assigned yet'}
          </p>
        </div>
      </div>

      {c.note && (
        <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', fontStyle: 'italic', paddingInline: 'var(--space-1)' }}>
          Recruiter note: &ldquo;{c.note}&rdquo;
        </p>
      )}

      <CoordinatorRoundEditor
        recruiterId={recruiterId}
        jdId={jdId}
        studentId={c.candidate.studentId}
        studentName={c.candidate.name}
        totalRounds={totalRounds}
        progress={c.progress}
        recordOutcomeAction={recordRoundOutcomeAction}
        setSignalAction={setCoordinationSignalAction}
      />
    </div>
  );
}

function CohortContactCard({
  companyName,
  cohortSize,
  coordinatorName,
}: {
  companyName: string;
  cohortSize: number;
  coordinatorName: string;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-2)',
      }}
    >
      <div>
        <p style={eyebrow}>Cohort coordination</p>
        <p style={{ fontSize: 'var(--fs-15)', color: 'var(--text-strong)', fontWeight: 'var(--fw-600)' }}>
          {coordinatorName} · {cohortSize === 1 ? '1 student' : `${cohortSize} students`} interviewing with {companyName}
        </p>
        <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
          On-the-day ops: ping the cohort group, mark attendance, and flag delays below. Comms route
          through the portal&rsquo;s WhatsApp BSP channel in production.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {/* Demo affordances — no real message sent in the prototype. */}
        <Button size="sm" variant="secondary" disabled>💬 Ping cohort (demo)</Button>
        <Button size="sm" variant="ghost" disabled>🚨 Escalate to placement head (demo)</Button>
      </div>
    </div>
  );
}

function slotDate(day: string): string {
  return new Date(day + 'T00:00:00Z').toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
  });
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
const backLink = { ...eyebrow, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
