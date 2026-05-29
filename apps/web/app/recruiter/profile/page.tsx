import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { RecruiterShell, StatusPill, type StatusTone } from '@nid/ui';
import { listForRecruiter, type JdRecord } from '@nid/module-jd-posting';
import {
  listPptBookings,
  listMeetings,
  listPptWindows,
  listMeetingSlots,
  type PptWindow,
  type MeetingSlot,
} from '@nid/module-recruiter-engagement';
import { listAssignmentsForJd, slotById } from '@nid/module-slot-booking';
import {
  recruiterScoreDetail,
  verifiedStrikeCount,
  BLACKLIST_STRIKE_THRESHOLD,
  listApiKeys,
} from '@nid/module-admin-accountability';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { subRolesForRecruiter, type RecruiterSubRole } from '~/lib/recruiter-subroles';
import { coordinatorForRecruiter, PLACEMENT_HEADS } from '~/lib/recruiter-public';
import { CURRENT_CYCLES } from '~/lib/public-content';

export const metadata: Metadata = {
  title: 'Your setup · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

/**
 * §L — "Your setup": a single read-only overview of everything this recruiter
 * has configured for the cycle and the dates each thing is pinned to. It reads
 * — never writes — across jd-posting, recruiter-engagement (PPT + meetings),
 * slot-booking, admin-accountability (health band + verified strikes + API
 * key), and the cycle/contacts reference data. Edit affordances live on the
 * individual surfaces (JDs, PPT, meetings, integrations); this page only
 * mirrors their established state so a recruiter can audit it at a glance.
 */
export default async function RecruiterProfilePage() {
  const { recruiterId, companyName, cycleId } = await readRecruiterSession();

  const subRoles = subRolesForRecruiter(recruiterId);
  const coordinator = coordinatorForRecruiter(recruiterId);
  const cycle = CURRENT_CYCLES.find((c) => `cycle_${c.slug.replace(/-/g, '_')}` === cycleId) ?? CURRENT_CYCLES[0];

  // JDs by status, each with the date that status was reached.
  const jds = [...listForRecruiter(recruiterId)].sort((a, b) => statusOrder(a.status) - statusOrder(b.status));
  const jdGpAcknowledged = jds.filter((j) => j.gpFeeAcknowledged);
  const jdsWithEvalTask = jds.filter((j) => j.evaluationTask?.required);

  // PPT windows the recruiter has booked (join booking → window for the date).
  const pptWindows = listPptWindows(cycleId);
  const windowById = new Map<string, PptWindow>(pptWindows.map((w) => [w.id, w] as const));
  const pptBookings = listPptBookings(recruiterId);

  // Placement-head meetings booked (join meeting → slot for the date).
  const meetingSlots = listMeetingSlots();
  const meetingSlotById = new Map<string, MeetingSlot>(meetingSlots.map((s) => [s.id, s] as const));
  const meetings = listMeetings(recruiterId);

  // Interview-slot bookings are stored per-JD; aggregate across this recruiter's JDs.
  const slotBookings = jds.flatMap((jd) =>
    listAssignmentsForJd(jd.id).map((a) => {
      const slot = slotById(a.slotId);
      return { jd, assignment: a, slot } as const;
    }),
  );

  // Health band + verified-strike count (admin-accountability).
  const scoreDetail = recruiterScoreDetail(recruiterId);
  const strikes = verifiedStrikeCount(recruiterId);
  const apiKey = listApiKeys().find((k) => k.recruiterId === recruiterId && k.status === 'active');

  return (
    <RecruiterShell companyName={companyName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-8)' }}>
            <p style={kicker}>{cycle?.label ?? 'Current cycle'}</p>
            <h1 style={pageTitle}>Your setup</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', maxWidth: '660px', lineHeight: 1.55 }}>
              Everything you&rsquo;ve configured for this cycle and the dates each thing is pinned to — your company
              roster, job descriptions, booked talks and meetings, interview slots, integrations, and your standing
              with the placement cell. This is a read-only overview; edit each item from its own page.
            </p>
          </header>

          {/* 1 · Company profile + sub-roles */}
          <Section title="Company profile" sub="Your single account and the named people on it (plan §recruiter sub-roles).">
            <KeyVals
              rows={[
                ['Company', companyName],
                ['Recruiter ID', recruiterId],
                ['Cycle', cycle?.label ?? cycleId],
                ['Assigned campus', coordinator?.campus ?? '—'],
              ]}
            />
            {subRoles.length > 0 ? (
              <ul style={listReset}>
                {subRoles.map((r) => (
                  <SubRoleRow key={r.id} role={r} />
                ))}
              </ul>
            ) : (
              <Empty>No sub-roles on file. Add HR Director / Hiring Manager / Interviewer contacts later.</Empty>
            )}
          </Section>

          {/* 2 · JDs by status, with dates */}
          <Section
            title="Job descriptions"
            sub="Grouped by status, with the date each one reached it. JDs are immutable once published."
            count={jds.length}
          >
            {jds.length > 0 ? (
              <ul style={listReset}>
                {jds.map((jd) => (
                  <JdRow key={jd.id} jd={jd} />
                ))}
              </ul>
            ) : (
              <Empty>No JDs yet. <Link href="/recruiter/jds/new">Post your first JD</Link>.</Empty>
            )}
          </Section>

          {/* 3 · Pre-Placement Talks */}
          <Section
            title="Pre-Placement Talks"
            sub="Windows you've booked from the placement cell's published calendar."
            count={pptBookings.length}
          >
            {pptBookings.length > 0 ? (
              <ul style={listReset}>
                {pptBookings.map((b) => {
                  const w = windowById.get(b.windowId);
                  return (
                    <Row
                      key={b.id}
                      primary={w ? `${formatDay(w.day)} · ${w.startTime}–${w.endTime}` : 'Window'}
                      secondary={w ? `${w.mode === 'virtual' ? 'Virtual' : 'On-campus'} · ${w.campus}` : undefined}
                      meta={`Booked ${formatStamp(b.bookedAt)}`}
                      pill={{ tone: 'success', label: 'Booked' }}
                    />
                  );
                })}
              </ul>
            ) : (
              <Empty>
                No PPT booked. <Link href="/recruiter/ppt">Book a window</Link> ({pptWindows.length} open).
              </Empty>
            )}
          </Section>

          {/* 4 · Placement-head meetings */}
          <Section
            title="Placement-head meetings"
            sub="Slots you've reserved with a campus placement head."
            count={meetings.length}
          >
            {meetings.length > 0 ? (
              <ul style={listReset}>
                {meetings.map((m) => {
                  const s = meetingSlotById.get(m.slotId);
                  return (
                    <Row
                      key={m.id}
                      primary={s ? `${formatDay(s.day)} · ${s.time}` : 'Meeting'}
                      secondary={s ? `${s.placementHead} · ${s.campus}` : undefined}
                      meta={`Scheduled ${formatStamp(m.scheduledAt)}${m.agenda.length > 0 ? ` · ${m.agenda.length} agenda item${m.agenda.length === 1 ? '' : 's'}` : ''}`}
                      pill={{ tone: 'success', label: 'Scheduled' }}
                    />
                  );
                })}
              </ul>
            ) : (
              <Empty>
                No meeting scheduled. <Link href="/recruiter/meetings">Meet a placement head</Link> ({meetingSlots.filter((s) => s.status === 'open').length} open).
              </Empty>
            )}
          </Section>

          {/* 5 · Interview slot bookings */}
          <Section
            title="Interview slots"
            sub="Candidate slots assigned across your JDs (booked from the admin-published calendar)."
            count={slotBookings.length}
          >
            {slotBookings.length > 0 ? (
              <ul style={listReset}>
                {slotBookings.map(({ jd, assignment, slot }) => (
                  <Row
                    key={`${assignment.jdId}-${assignment.slotId}-${assignment.studentId}`}
                    primary={slot ? `${formatDay(slot.day)} · ${slot.startTime}–${slot.endTime}` : 'Slot'}
                    secondary={`${jd.title || 'Untitled JD'} · ${assignment.studentId}`}
                    meta={`Assigned ${formatStamp(assignment.assignedAt)}${assignment.interviewers.length > 0 ? ` · ${assignment.interviewers.length} interviewer${assignment.interviewers.length === 1 ? '' : 's'}` : ''}`}
                  />
                ))}
              </ul>
            ) : (
              <Empty>No interview slots assigned yet. Assign candidates from a published JD&rsquo;s slots page.</Empty>
            )}
          </Section>

          {/* 6 · GP-fee acknowledgements + fees */}
          <Section title="Fees & acknowledgements" sub="What you've acknowledged and the figures that apply this cycle (plan §4.18).">
            <KeyVals
              rows={[
                ['Participation fee', cycle ? formatRupees(cycle.participationFeeRupees) : '—'],
                ['Graduation-project fee (per student)', cycle ? formatRupees(cycle.gpFeePerStudentRupees) : '—'],
              ]}
            />
            <p style={{ ...microNote, marginTop: 'var(--space-3)' }}>
              {jds.length === 0
                ? 'No JDs yet — the per-student GP fee is acknowledged per JD at posting time.'
                : `GP-fee acknowledged on ${jdGpAcknowledged.length} of ${jds.length} JD${jds.length === 1 ? '' : 's'}.`}
            </p>
            {jds.length > 0 && (
              <ul style={listReset}>
                {jds.map((jd) => (
                  <Row
                    key={`gp-${jd.id}`}
                    primary={jd.title || 'Untitled JD'}
                    secondary={roleTypeLabel(jd.roleType)}
                    pill={
                      jd.gpFeeAcknowledged
                        ? { tone: 'success', label: 'Acknowledged' }
                        : { tone: 'neutral', label: 'Not yet' }
                    }
                  />
                ))}
              </ul>
            )}
          </Section>

          {/* 7 · Evaluation tasks attached to JDs */}
          {jdsWithEvalTask.length > 0 && (
            <Section
              title="Evaluation tasks"
              sub="Tasks you've attached to a JD, released on the cycle's institute dates."
              count={jdsWithEvalTask.length}
            >
              <ul style={listReset}>
                {jdsWithEvalTask.map((jd) => (
                  <Row
                    key={`eval-${jd.id}`}
                    primary={jd.evaluationTask?.title || 'Evaluation task'}
                    secondary={jd.title || 'Untitled JD'}
                    pill={
                      jd.evaluationTask?.releaseAlignedToCycle
                        ? { tone: 'info', label: 'Cycle-aligned release' }
                        : { tone: 'neutral', label: 'Manual release' }
                    }
                  />
                ))}
              </ul>
            </Section>
          )}

          {/* 8 · Integrations / API status */}
          <Section title="API & alerts" sub="Your read-only integration access (plan §recruiter API).">
            {apiKey ? (
              <>
                <KeyVals
                  rows={[
                    ['API key', apiKey.id],
                    ['Scopes', apiKey.scope],
                    ['Issued', formatStamp(apiKey.issuedAt)],
                  ]}
                />
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <StatusPill tone="success">key active</StatusPill>
                </div>
              </>
            ) : (
              <Empty>No active API key. Read-only access is provisioned by the placement cell.</Empty>
            )}
            <p style={{ ...microNote, marginTop: 'var(--space-3)' }}>
              <Link href="/recruiter/integrations">Manage API &amp; webhooks</Link> — calendar feed, ATS webhooks, REST API.
            </p>
          </Section>

          {/* 9 · Standing — health band + verified strikes */}
          <Section title="Your standing" sub="What the placement cell sees — health band and institution-verified strikes (plan §K).">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
              {scoreDetail ? (
                <StatusPill tone={bandTone(scoreDetail.band)}>{scoreDetail.band} band</StatusPill>
              ) : (
                <StatusPill tone="info">good band</StatusPill>
              )}
              <StatusPill tone={strikes >= BLACKLIST_STRIKE_THRESHOLD ? 'danger' : strikes > 0 ? 'warning' : 'success'}>
                {strikes}/{BLACKLIST_STRIKE_THRESHOLD} verified strikes
              </StatusPill>
            </div>
            <p style={{ ...microNote, marginTop: 'var(--space-3)' }}>
              {strikes >= BLACKLIST_STRIKE_THRESHOLD
                ? `At ${BLACKLIST_STRIKE_THRESHOLD} verified strikes a company is eligible for blacklisting.`
                : `A verified strike is logged only after the placement cell upholds a student redressal. ${BLACKLIST_STRIKE_THRESHOLD} → blacklist.`}{' '}
              <Link href="/recruiter/stats">See the full conduct breakdown</Link>.
            </p>
          </Section>

          {/* 10 · Your contacts (closing reference) */}
          <Section title="Your contacts" sub="Who to reach at the placement cell for this cycle.">
            <KeyVals
              rows={[
                ['Student coordinator', coordinator ? `${coordinator.name} · ${coordinator.campus}` : 'Not yet assigned'] as const,
                ...PLACEMENT_HEADS.filter((p) => !coordinator || p.campus === coordinator.campus).map(
                  (p) => [`Placement head · ${p.campus}`, `${p.name} · ${p.email}`] as const,
                ),
              ]}
            />
          </Section>
        </div>
      </section>
    </RecruiterShell>
  );
}

// ── Presentational helpers ───────────────────────────────────────────────────

function Section({
  title,
  sub,
  count,
  children,
}: {
  title: string;
  sub: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        marginBottom: 'var(--space-5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
        <h2 style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{title}</h2>
        {count != null && (
          <span style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', margin: '0 0 var(--space-4)', lineHeight: 1.5 }}>{sub}</p>
      {children}
    </section>
  );
}

function KeyVals({ rows }: { rows: ReadonlyArray<readonly [string, string]> }) {
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, max-content) 1fr', gap: 'var(--space-1) var(--space-4)', margin: 0 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</dt>
          <dd style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)', margin: 0 }}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function SubRoleRow({ role }: { role: RecruiterSubRole }) {
  return (
    <li style={rowItem}>
      <div style={{ minWidth: 0 }}>
        <p style={rowPrimary}>{role.name}</p>
        <p style={rowSecondary}>{role.title}</p>
      </div>
      <span style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>{role.phone}</span>
    </li>
  );
}

function JdRow({ jd }: { jd: JdRecord }) {
  return (
    <li style={rowItem}>
      <div style={{ minWidth: 0 }}>
        <p style={rowPrimary}>{jd.title || 'Untitled draft'}</p>
        <p style={rowSecondary}>{roleTypeLabel(jd.roleType)} · {jdDateLabel(jd)}</p>
      </div>
      <StatusPill tone={jdStatusTone(jd.status)}>{jdStatusLabel(jd.status)}</StatusPill>
    </li>
  );
}

function Row({
  primary,
  secondary,
  meta,
  pill,
}: {
  primary: string;
  secondary?: string | undefined;
  meta?: string | undefined;
  pill?: { tone: StatusTone; label: string } | undefined;
}) {
  return (
    <li style={rowItem}>
      <div style={{ minWidth: 0 }}>
        <p style={rowPrimary}>{primary}</p>
        {secondary != null && <p style={rowSecondary}>{secondary}</p>}
        {meta != null && <p style={rowSecondary}>{meta}</p>}
      </div>
      {pill && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', margin: 0 }}>{children}</p>;
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)' }}>
      {children}
    </a>
  );
}

// ── Pure label/format helpers ────────────────────────────────────────────────

function statusOrder(status: JdRecord['status']): number {
  const order: Record<JdRecord['status'], number> = {
    published: 0,
    'in-moderation': 1,
    draft: 2,
    closed: 3,
    withdrawn: 4,
  };
  return order[status];
}

function jdStatusLabel(status: JdRecord['status']): string {
  const labels: Record<JdRecord['status'], string> = {
    draft: 'Draft',
    'in-moderation': 'In moderation',
    published: 'Published',
    closed: 'Closed',
    withdrawn: 'Withdrawn',
  };
  return labels[status];
}

function jdStatusTone(status: JdRecord['status']): StatusTone {
  switch (status) {
    case 'published':
      return 'success';
    case 'in-moderation':
      return 'info';
    case 'draft':
      return 'neutral';
    case 'closed':
      return 'warning';
    case 'withdrawn':
      return 'danger';
  }
}

/** The date stamp most relevant to a JD's current status. */
function jdDateLabel(jd: JdRecord): string {
  if (jd.status === 'published' && jd.publishedAt) return `Published ${formatStamp(jd.publishedAt)}`;
  if (jd.status === 'in-moderation' && jd.submittedAt) return `Submitted ${formatStamp(jd.submittedAt)}`;
  if (jd.status === 'closed' && jd.closedAt) return `Closed ${formatStamp(jd.closedAt)}`;
  if (jd.status === 'withdrawn' && jd.withdrawnAt) return `Withdrawn ${formatStamp(jd.withdrawnAt)}`;
  return `Drafted ${formatStamp(jd.draftedAt)}`;
}

function roleTypeLabel(roleType: JdRecord['roleType']): string {
  switch (roleType) {
    case 'full-time':
      return 'Full-time';
    case 'vacation-internship':
      return 'Vacation internship';
    case 'during-course-internship':
      return 'During-course internship';
  }
}

function bandTone(band: string): StatusTone {
  return band === 'excellent'
    ? 'success'
    : band === 'good'
      ? 'info'
      : band === 'watch'
        ? 'warning'
        : band === 'restricted'
          ? 'danger'
          : 'neutral';
}

/** "₹15,000" — Indian-grouped rupee figure from a whole-rupee integer. */
function formatRupees(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN')}`;
}

/** A YYYY-MM-DD activity day → "23 May 2026". */
function formatDay(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** An ISO timestamp → "23 May 2026". Falls back to the raw value if unparseable. */
function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Tokens-only style objects ────────────────────────────────────────────────

const kicker: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};

const pageTitle: CSSProperties = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
};

const listReset: CSSProperties = { listStyle: 'none', margin: 'var(--space-3) 0 0', padding: 0 };

const rowItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  paddingBlock: 'var(--space-3)',
  borderTop: '1px solid var(--border-default)',
};

const rowPrimary: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const rowSecondary: CSSProperties = {
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  margin: '2px 0 0',
};

const microNote: CSSProperties = {
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
};
