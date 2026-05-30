import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { notFound } from 'next/navigation';
import { RecruiterShell, StatusPill } from '@nid/ui';
import { getJd } from '@nid/module-jd-posting';
import {
  buildInterviewDayView,
  getTransportMode,
  getCandidateRounds,
  getInterviewsComplete,
  listSelected,
  listRejected,
  listRoundProgressForJd,
  type QueueEntry,
  type RoundProgress,
  type TransportMode,
} from '@nid/module-interview-console';
import { listShortlist, getCandidate, type CandidateView } from '@nid/module-candidate-browse';
import { listAssignmentsForJd, slotById, type Slot } from '@nid/module-slot-booking';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { coordinatorForRecruiter } from '~/lib/recruiter-public';
import {
  InterviewTabs,
  type ShortlistedCandidateVM,
  type DuringRowVM,
  type AfterRowVM,
  type EvaluationTaskVM,
  type CoordinatorVM,
} from '~/components/InterviewTabs';
import { setTransportAction, recordOutcomeAction, setDecisionAction, markCompleteAction } from './actions';

export const metadata: Metadata = {
  title: 'Interviews · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

const TRANSPORTS: ReadonlyArray<{ key: TransportMode; label: string; hint: string }> = [
  { key: 'live', label: 'Live push', hint: 'SSE · instant · best on stable Wi-Fi' },
  { key: 'periodic', label: 'Periodic 15s', hint: 'lower battery · better on flaky Wi-Fi' },
  { key: 'manual', label: 'Manual', hint: 'pull-to-refresh · offline-friendly' },
];

function slotLabel(s: Slot): string {
  const d = new Date(s.day + 'T00:00:00Z').toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
  });
  return `${d} · ${s.startTime}`;
}

export default async function InterviewConsole({ params }: { params: Promise<{ jdId: string }> }) {
  const { jdId } = await params;
  const jd = getJd(jdId);
  if (!jd) notFound();

  const view = buildInterviewDayView(jdId);
  const transport = getTransportMode(DEMO_RECRUITER.recruiterId);
  const interviewsComplete = getInterviewsComplete(jdId);

  // ── Before: shortlisted candidates + their slot + interviewers ──────────
  const shortlist = listShortlist(jdId);
  const assignments = listAssignmentsForJd(jdId);
  const assignmentByStudent = new Map(assignments.map((a) => [a.studentId, a]));

  const before: ShortlistedCandidateVM[] = shortlist.map(({ candidate, note }) => {
    const assignment = assignmentByStudent.get(candidate.studentId);
    const slot = assignment ? slotById(assignment.slotId) : null;
    return {
      studentId: candidate.studentId,
      name: candidate.name,
      disciplineName: candidate.disciplineName,
      note,
      portfolioUrl: candidate.portfolioUrl,
      portfolioHost: candidate.portfolioHost,
      cvAvailable: candidate.cvAvailable,
      ...(candidate.cvUrl !== undefined ? { cvUrl: candidate.cvUrl } : {}),
      ...(candidate.presentationUrl !== undefined ? { presentationUrl: candidate.presentationUrl } : {}),
      ...(candidate.statementOfIntent !== undefined ? { statementOfIntent: candidate.statementOfIntent } : {}),
      ...(slot ? { slotLabel: slotLabel(slot) } : {}),
      interviewers: assignment?.interviewers ?? [],
    };
  });

  // ── During: pair each queue entry with its persisted round progress ─────
  // The form should target the *next* round: advance past a completed round
  // when the latest recorded outcome was an advance; otherwise re-record the
  // current round (e.g. after a hold) or start at round 1 when none recorded.
  const duringFor = (entry: QueueEntry): DuringRowVM => {
    const progress = getCandidateRounds(jdId, entry.studentId);
    const latest = progress.perRound[progress.perRound.length - 1];
    const nextRound = latest === undefined ? 1 : latest.outcome === 'advance' ? progress.currentRound + 1 : progress.currentRound;
    return { entry, nextRound, decision: progress.decision };
  };
  const during: DuringRowVM[] = [
    ...(view.nowInterviewing ? [duringFor(view.nowInterviewing)] : []),
    ...view.upNext.map(duringFor),
  ];

  // ── After: selected / rejected / pending with full round records ────────
  const noteByStudent = new Map(shortlist.map((s) => [s.candidate.studentId, s.note]));
  const toAfterRow = (p: RoundProgress): AfterRowVM | null => {
    const candidate: CandidateView | null = getCandidate(p.studentId);
    if (!candidate) return null;
    return {
      studentId: p.studentId,
      name: candidate.name,
      disciplineName: candidate.disciplineName,
      note: noteByStudent.get(p.studentId) ?? '',
      portfolioUrl: candidate.portfolioUrl,
      portfolioHost: candidate.portfolioHost,
      ...(candidate.presentationUrl !== undefined ? { presentationUrl: candidate.presentationUrl } : {}),
      perRound: p.perRound,
      decision: p.decision,
    };
  };
  const isRow = (r: AfterRowVM | null): r is AfterRowVM => r !== null;
  const selected = listSelected(jdId).map(toAfterRow).filter(isRow);
  const rejected = listRejected(jdId).map(toAfterRow).filter(isRow);
  const pending = listRoundProgressForJd(jdId)
    .filter((p) => p.decision === 'pending' && p.perRound.length > 0)
    .map(toAfterRow)
    .filter(isRow);

  // ── Coordinator (ties into dashboard Contacts) ──────────────────────────
  const coordRecord = coordinatorForRecruiter(DEMO_RECRUITER.recruiterId);
  const coordinator: CoordinatorVM | undefined = coordRecord
    ? { name: coordRecord.name, campus: coordRecord.campus }
    : undefined;

  const evaluationTask: EvaluationTaskVM | undefined =
    jd.evaluationTask && jd.evaluationTask.required && jd.evaluationTask.title.trim().length > 0
      ? {
          title: jd.evaluationTask.title,
          releaseAlignedToCycle: jd.evaluationTask.releaseAlignedToCycle,
          ...(jd.evaluationTask.briefMd !== undefined ? { briefMd: jd.evaluationTask.briefMd } : {}),
          ...(jd.evaluationTask.estimatedHours !== undefined ? { estimatedHours: jd.evaluationTask.estimatedHours } : {}),
        }
      : undefined;

  return (
    <RecruiterShell activeNav="jds" companyName={DEMO_RECRUITER.companyName} accountMenu={<RecruiterAccountMenu companyName={DEMO_RECRUITER.companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-8)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <a href={`/recruiter/jds/${jdId}/slots`} style={backLink}>
              ← Slots
            </a>
            <a href={`/recruiter/jds/${jdId}/offers`} style={{ ...backLink, color: 'var(--accent)' }}>
              Offers →
            </a>
          </div>

          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>{jd.title}</p>
            <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
              Interviews
            </h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Before, during, and after — the full evaluation record for this JD’s interviews. Offers unlock once
              you mark interviews complete.
            </p>
          </header>

          <InterviewTabs
            jdId={jdId}
            rounds={jd.interviewRounds.map((r) => ({ round: r.round, focus: r.focus }))}
            {...(evaluationTask ? { evaluationTask } : {})}
            {...(coordinator ? { coordinator } : {})}
            before={before}
            view={view}
            during={during}
            after={{ selected, rejected, pending }}
            interviewsComplete={interviewsComplete}
            recordOutcomeAction={recordOutcomeAction}
            setDecisionAction={setDecisionAction}
            markCompleteAction={markCompleteAction}
          />

          {/* Transport settings — the live-console cadence for the During phase. */}
          <div style={{ marginTop: 'var(--space-8)', backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', maxWidth: '480px' }}>
            <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Live update mode</p>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {TRANSPORTS.map((t) => (
                <form key={t.key} action={setTransportAction}>
                  <input type="hidden" name="jdId" value={jdId} />
                  <input type="hidden" name="mode" value={t.key} />
                  <button
                    type="submit"
                    aria-pressed={transport === t.key}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-2)',
                      border: `1px solid ${transport === t.key ? 'var(--accent)' : 'var(--border-default)'}`,
                      backgroundColor:
                        transport === t.key ? 'color-mix(in oklch, var(--accent), white 85%)' : 'var(--surface-card)',
                      cursor: 'pointer',
                    }}
                  >
                    <span>
                      <span style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                        {t.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
                        {t.hint}
                      </span>
                    </span>
                    {transport === t.key && <StatusPill tone="success">Active</StatusPill>}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      </section>
    </RecruiterShell>
  );
}

const label = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
};
const backLink = { ...label, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
