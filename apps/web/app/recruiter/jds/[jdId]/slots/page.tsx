import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell, Button, StatusPill } from '@nid/ui';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';
import { listShortlist } from '@nid/module-candidate-browse';
import { listOpenSlots, listAssignmentsForJd, type Slot } from '@nid/module-slot-booking';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { subRolesForRecruiter, subRoleLabel } from '~/lib/recruiter-subroles';
import { InterviewerPicker, type SubRoleOption } from '~/components/InterviewerPicker';
import { assignSlotAction, assignInterviewersAction } from './actions';

export const metadata: Metadata = {
  title: 'Interview slots · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function RecruiterSlotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ jdId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { jdId } = await params;
  const jd = await requireOwnedJd(jdId);
  const error = (await searchParams).error;

  const shortlist = listShortlist(jdId);
  const slots = listOpenSlots(jd.cycleId);
  const assignments = listAssignmentsForJd(jdId);
  const assignedSlotByStudent = new Map(assignments.map((a) => [a.studentId, a.slotId]));
  // Expected interviewers per candidate are stored on the assignment as label
  // strings (e.g. "Priya Menon · HR Director"); the picker round-trips them back
  // to sub-role ids for its checkboxes (plan §P).
  const interviewerLabelsByStudent = new Map(assignments.map((a) => [a.studentId, a.interviewers]));

  // The company's named sub-roles (HR Director / Hiring Manager / Interviewer)
  // are the interviewer options. Map by label so stored assignments resolve to
  // ids; build the picker option list once.
  const subRoles = subRolesForRecruiter(DEMO_RECRUITER.recruiterId);
  const subRoleOptions: SubRoleOption[] = subRoles.map((r) => ({
    id: r.id,
    label: subRoleLabel(r),
    title: r.title,
    phone: r.phone,
  }));
  const subRoleIdByLabel = new Map(subRoles.map((r) => [subRoleLabel(r), r.id]));

  return (
    <RecruiterShell activeNav="jds" companyName={DEMO_RECRUITER.companyName} accountMenu={<RecruiterAccountMenu companyName={DEMO_RECRUITER.companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <a href={`/recruiter/jds/${jdId}/applicants`} style={backLink}>← Applicants</a>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>{jd.title} · interview scheduling</p>
            <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
              Book interview slots
            </h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Assign each shortlisted candidate to a slot the placement cell has opened. Slots have limited capacity.
            </p>
          </header>

          {error && <p role="alert" style={errorBanner}>{decodeURIComponent(error)}</p>}

          {shortlist.length === 0 ? (
            <Notice>
              No shortlisted candidates yet. <a href={`/recruiter/jds/${jdId}/applicants`} style={{ color: 'var(--accent)' }}>Shortlist some first.</a>
            </Notice>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {shortlist.map(({ candidate }) => {
                const assignedSlotId = assignedSlotByStudent.get(candidate.studentId);
                const selectedInterviewerIds = (interviewerLabelsByStudent.get(candidate.studentId) ?? [])
                  .map((lbl) => subRoleIdByLabel.get(lbl))
                  .filter((id): id is string => id !== undefined);
                return (
                  <div
                    key={candidate.studentId}
                    style={{
                      display: 'grid',
                      gap: 'var(--space-4)',
                      backgroundColor: 'var(--surface-card)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 'var(--card-radius)',
                      padding: 'var(--card-padding)',
                    }}
                  >
                    <form
                      action={assignSlotAction}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--space-4)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <input type="hidden" name="jdId" value={jdId} />
                      <input type="hidden" name="studentId" value={candidate.studentId} />
                      <div style={{ minWidth: '200px' }}>
                        <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                          {candidate.name}
                        </p>
                        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>{candidate.disciplineName}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                          name="slotId"
                          defaultValue={assignedSlotId ?? ''}
                          style={selectStyle}
                          aria-label={`Slot for ${candidate.name}`}
                        >
                          <option value="" disabled>
                            Choose a slot…
                          </option>
                          {assignedSlotId && <option value="__unassign__">— Unassign —</option>}
                          {slots.map((s) => (
                            <option key={s.id} value={s.id} disabled={s.booked >= s.capacity && s.id !== assignedSlotId}>
                              {slotLabel(s)} {s.booked >= s.capacity && s.id !== assignedSlotId ? '(full)' : `(${s.booked}/${s.capacity})`}
                            </option>
                          ))}
                        </select>
                        {assignedSlotId && <StatusPill tone="success">Scheduled</StatusPill>}
                        <Button type="submit" size="sm" variant={assignedSlotId ? 'secondary' : 'primary'}>
                          {assignedSlotId ? 'Update' : 'Assign'}
                        </Button>
                      </div>
                    </form>

                    {/* Per-candidate expected interviewers, drawn from the company's sub-roles (§P). */}
                    <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 'var(--space-3)' }}>
                      <InterviewerPicker
                        jdId={jdId}
                        studentId={candidate.studentId}
                        candidateName={candidate.name}
                        options={subRoleOptions}
                        selectedIds={selectedInterviewerIds}
                        hasSlot={assignedSlotId !== undefined}
                        action={assignInterviewersAction}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

function slotLabel(s: Slot): string {
  const d = new Date(s.day + 'T00:00:00Z').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' });
  return `${d} · ${s.startTime}–${s.endTime}`;
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-8)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--card-radius)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' }}>
      {children}
    </p>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const backLink = { ...label, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const selectStyle = {
  minHeight: 'var(--input-min-height)',
  padding: 'var(--input-padding-y) var(--input-padding-x)',
  fontSize: 'var(--fs-14)',
  fontFamily: 'var(--ff-sans)',
  color: 'var(--input-fg)',
  backgroundColor: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--input-radius)',
};
const errorBanner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
