import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminShell, Button, Field, StatusPill, type StatusTone } from '@nid/ui';
import {
  getJd,
  gateReportFor,
  skillLabel,
  DISCIPLINES_REF,
  type JdRecord,
  type GateReport,
  type DisciplineRef,
} from '@nid/module-jd-posting';
import { publishJdAction, holdJdAction } from './actions';

interface PageParams {
  readonly jdId: string;
}
interface SearchParams {
  readonly error?: string;
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { jdId } = await params;
  return { title: `Review ${jdId} · Admin · NID Industry Interface`, robots: { index: false, follow: false } };
}

export default async function AdminJdReview({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { jdId } = await params;
  const jd = getJd(jdId);
  if (!jd) notFound();
  const error = (await searchParams).error;
  const report = gateReportFor(jd);

  // Suggest disciplines whose programme matches the JD's target programmes.
  const suggested = DISCIPLINES_REF.filter(
    (d) => d.programme === 'both' || jd.targetProgrammes.includes(d.programme as 'bachelors' | 'masters'),
  );
  const isModeratable = jd.status === 'in-moderation';

  return (
    <AdminShell activeNav="jds" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <a
            href="/admin/jds"
            style={{
              fontSize: 'var(--fs-12)',
              fontWeight: 'var(--fw-600)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: 'var(--space-4)',
            }}
          >
            ← JD moderation
          </a>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
              paddingBottom: 'var(--space-6)',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <div>
              <p style={metaLabel}>{jd.id}</p>
              <h1 style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' }}>
                {jd.title}
              </h1>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                {roleTypeLabel(jd.roleType)} · {jd.location} · {jd.workMode} · {jd.positions}{' '}
                {jd.positions === 1 ? 'position' : 'positions'}
              </p>
            </div>
            <StatusPill tone={statusTone(jd.status)}>{statusLabel(jd.status)}</StatusPill>
          </div>

          {error && (
            <p role="alert" style={errorBanner}>
              {decodeURIComponent(error)}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--space-8)' }}>
            <div>
              <GateReportCard report={report} roleType={jd.roleType} />

              <Section title="Compensation">
                <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-strong)' }}>{compLabel(jd)}</p>
              </Section>

              <Section title="Skills">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {jd.skills.map((s) => (
                    <span key={s.slug} style={skillChip(s.required)}>
                      {skillLabel(s.slug)}
                      {s.required ? '' : ' (pref)'}
                    </span>
                  ))}
                </div>
              </Section>

              <Section title="Responsibilities">
                {Object.entries(jd.responsibilities).length === 0 ? (
                  <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>None specified.</p>
                ) : (
                  Object.entries(jd.responsibilities).map(([cat, items]) => (
                    <div key={cat} style={{ marginBottom: 'var(--space-3)' }}>
                      <p style={metaLabel}>{cat}</p>
                      <ul style={{ margin: 'var(--space-1) 0 0', paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
                        {items.map((it, i) => (
                          <li key={i}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </Section>

              <Section title="Deliverables">
                <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
                  {jd.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </Section>

              <Section title="Interview rounds">
                <ol style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
                  {jd.interviewRounds.map((r) => (
                    <li key={r.round}>{r.focus}</li>
                  ))}
                </ol>
              </Section>

              {jd.supplementaryProseMd && (
                <Section title="Supplementary description">
                  <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {jd.supplementaryProseMd}
                  </p>
                </Section>
              )}
            </div>

            <aside>
              {isModeratable ? (
                <>
                  <PublishCard jdId={jd.id} suggested={suggested} />
                  <HoldCard jdId={jd.id} />
                </>
              ) : (
                <Section title="Status">
                  <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
                    This JD is <strong>{statusLabel(jd.status)}</strong>. Moderation actions are only available while a
                    JD is awaiting moderation.
                  </p>
                  {jd.moderationNote && (
                    <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)', marginTop: 'var(--space-3)' }}>
                      Moderation note: {jd.moderationNote}
                    </p>
                  )}
                </Section>
              )}
            </aside>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function GateReportCard({ report, roleType }: { report: GateReport; roleType: JdRecord['roleType'] }) {
  const rupees = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;
  return (
    <Section title="Pre-publish gate report">
      <div style={{ display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--fs-14)' }}>
        <Row label="Stipend floor" value={<StatusPill tone={report.stipendFloorPasses ? 'success' : 'danger'}>{report.stipendFloorPasses ? 'Passes' : 'Below floor'}</StatusPill>} />
        <Row label="Cycle floor" value={rupees(report.cycleFloorPaise)} />
        <Row
          label="Scope-creep multiplier"
          value={`${report.scopeCreepMultiplier}× ${report.hasEngineeringSkills ? '(engineering skills bundled)' : ''}`}
        />
        <Row label="Adjusted floor" value={rupees(report.adjustedFloorPaise)} />
        {roleType === 'full-time' ? (
          <Row
            label="Offered range"
            value={
              report.offeredLowPaise && report.offeredHighPaise
                ? `${rupees(report.offeredLowPaise)} – ${rupees(report.offeredHighPaise)}`
                : '—'
            }
          />
        ) : (
          <Row label="Offered stipend" value={report.offeredStipendPaise ? rupees(report.offeredStipendPaise) : '—'} />
        )}
      </div>
    </Section>
  );
}

function PublishCard({ jdId, suggested }: { jdId: string; suggested: readonly DisciplineRef[] }) {
  return (
    <form action={publishJdAction} style={cardStyle}>
      <input type="hidden" name="jdId" value={jdId} />
      <h2 style={cardTitle}>Confirm disciplines &amp; publish</h2>
      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
        Which NID disciplines should see this JD? You are translating the recruiter&rsquo;s role into the disciplines
        whose graduates actually fit. At least one required.
      </p>
      <div style={{ display: 'grid', gap: 'var(--space-1)', maxHeight: '260px', overflowY: 'auto', marginBottom: 'var(--space-4)' }}>
        {suggested.map((d) => (
          <label key={d.id} style={checkboxRow}>
            <input type="checkbox" name="disciplineIds" value={d.id} />
            <span>{d.name}</span>
          </label>
        ))}
      </div>
      <Field id="publish-note" name="note" label="Moderation note (optional)" placeholder="Visible to the recruiter" />
      <div style={{ marginTop: 'var(--space-3)' }}>
        <Button type="submit" size="sm">
          Publish JD
        </Button>
      </div>
    </form>
  );
}

function HoldCard({ jdId }: { jdId: string }) {
  return (
    <form action={holdJdAction} style={{ ...cardStyle, marginTop: 'var(--space-4)' }}>
      <input type="hidden" name="jdId" value={jdId} />
      <h2 style={cardTitle}>Hold for clarification</h2>
      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
        Send the JD back to the recruiter as a draft with a clarification request.
      </p>
      <Field id="hold-note" name="note" label="Clarification (required)" placeholder="What needs to change?" required />
      <div style={{ marginTop: 'var(--space-3)' }}>
        <Button type="submit" size="sm" variant="secondary">
          Hold &amp; return
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        marginBottom: 'var(--space-4)',
      }}
    >
      <h2 style={cardTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-500)' }}>{value}</span>
    </div>
  );
}

const metaLabel = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
};
const cardStyle = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
} as const;
const cardTitle = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-3)',
};
const checkboxRow = {
  display: 'flex',
  gap: 'var(--space-2)',
  alignItems: 'center',
  fontSize: 'var(--fs-14)',
  color: 'var(--text-strong)',
  padding: 'var(--space-1) 0',
  cursor: 'pointer',
} as const;
const errorBanner = {
  marginBottom: 'var(--space-6)',
  padding: 'var(--space-4)',
  backgroundColor: 'var(--pill-danger-bg)',
  color: 'var(--pill-danger-fg)',
  borderRadius: 'var(--radius-3)',
  fontWeight: 'var(--fw-600)',
} as const;
const skillChip = (required: boolean) =>
  ({
    fontSize: 'var(--fs-12)',
    fontWeight: 'var(--fw-600)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    backgroundColor: required ? 'var(--accent)' : 'var(--surface-panel)',
    color: required ? 'var(--text-on-accent)' : 'var(--text-secondary)',
  }) as const;

function statusLabel(status: JdRecord['status']): string {
  return status === 'in-moderation'
    ? 'In moderation'
    : status === 'published'
      ? 'Published'
      : status === 'draft'
        ? 'Draft'
        : status;
}
function statusTone(status: JdRecord['status']): StatusTone {
  return status === 'in-moderation' ? 'warning' : status === 'published' ? 'success' : 'neutral';
}
function roleTypeLabel(roleType: JdRecord['roleType']): string {
  return roleType === 'full-time'
    ? 'Full-time'
    : roleType === 'vacation-internship'
      ? 'Vacation internship'
      : 'During-course internship';
}
function compLabel(jd: JdRecord): string {
  const rupees = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;
  if (jd.roleType === 'full-time') {
    return jd.baseMinPaise && jd.baseMaxPaise ? `${rupees(jd.baseMinPaise)} – ${rupees(jd.baseMaxPaise)} / yr` : 'CTC TBD';
  }
  return jd.stipendPaise ? `${rupees(jd.stipendPaise)} / mo` : 'stipend TBD';
}
