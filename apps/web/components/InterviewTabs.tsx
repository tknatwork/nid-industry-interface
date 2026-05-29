'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Tabs, Button, StatusPill } from '@nid/ui';
import type { RoundProgress, InterviewDayView, QueueEntry } from '@nid/module-interview-console';

/**
 * Interview tab — Before / During / After (plan §R).
 *
 * Server component (`page.tsx`) resolves the JD, builds the day-of view, and
 * fetches the shared round-progress records, then hands plain serializable data
 * + three server actions to this client wrapper. The wrapper owns the `Tabs`
 * selection state and the small per-candidate forms.
 *
 *  • Before — selected (shortlisted) students: notes + portfolio + CV +
 *    statement-of-intent + assigned slot + expected interviewers, plus the JD's
 *    evaluation task so the recruiter sees what students were asked to prepare.
 *  • During — the live day-of console (`buildInterviewDayView`) with real
 *    coordination signals; Advance / Hold / Reject now persist via
 *    `recordRoundOutcome`, capturing a per-round evaluation score + note.
 *  • After — selected vs rejected with per-round scores + a
 *    "Mark interviews complete · Done & Dusted" action that flips the per-JD
 *    `interviewsComplete` flag (this is what unlocks Offers).
 *
 * Styled with design tokens only.
 */

// ── Serializable view shapes assembled by the page ────────────────────────

export interface ShortlistedCandidateVM {
  readonly studentId: string;
  readonly name: string;
  readonly disciplineName: string;
  readonly note: string;
  readonly portfolioUrl: string;
  readonly portfolioHost: string;
  readonly cvAvailable: boolean;
  readonly cvUrl?: string;
  readonly presentationUrl?: string;
  readonly statementOfIntent?: string;
  readonly slotLabel?: string;
  readonly interviewers: readonly string[];
}

export interface EvaluationTaskVM {
  readonly title: string;
  readonly briefMd?: string;
  readonly estimatedHours?: number;
  readonly releaseAlignedToCycle: boolean;
}

export interface InterviewRoundVM {
  readonly round: number;
  readonly focus: string;
}

export interface CoordinatorVM {
  readonly name: string;
  readonly campus: string;
}

/** A row for the During phase: pairs a queue entry with its persisted progress. */
export interface DuringRowVM {
  readonly entry: QueueEntry;
  /** The round the next outcome should be recorded against (advances past completed rounds). */
  readonly nextRound: number;
  readonly decision: RoundProgress['decision'];
}

/** A row for the After phase: candidate identity + their full round record. */
export interface AfterRowVM {
  readonly studentId: string;
  readonly name: string;
  readonly disciplineName: string;
  readonly note: string;
  readonly portfolioUrl: string;
  readonly portfolioHost: string;
  readonly presentationUrl?: string;
  readonly perRound: RoundProgress['perRound'];
  readonly decision: RoundProgress['decision'];
}

export interface InterviewTabsProps {
  readonly jdId: string;
  readonly rounds: readonly InterviewRoundVM[];
  readonly evaluationTask?: EvaluationTaskVM;
  readonly coordinator?: CoordinatorVM;
  readonly before: readonly ShortlistedCandidateVM[];
  readonly view: InterviewDayView;
  readonly during: readonly DuringRowVM[];
  readonly after: {
    readonly selected: readonly AfterRowVM[];
    readonly rejected: readonly AfterRowVM[];
    readonly pending: readonly AfterRowVM[];
  };
  readonly interviewsComplete: boolean;
  readonly recordOutcomeAction: (formData: FormData) => void | Promise<void>;
  readonly setDecisionAction: (formData: FormData) => void | Promise<void>;
  readonly markCompleteAction: (formData: FormData) => void | Promise<void>;
}

export function InterviewTabs(props: InterviewTabsProps) {
  const {
    jdId,
    rounds,
    evaluationTask,
    coordinator,
    before,
    view,
    during,
    after,
    interviewsComplete,
    recordOutcomeAction,
    setDecisionAction,
    markCompleteAction,
  } = props;

  const selectedCount = after.selected.length;
  const rejectedCount = after.rejected.length;

  return (
    <Tabs
      aria-label="Interview phases"
      variant="pill"
      defaultValue={interviewsComplete ? 'after' : 'during'}
      items={[
        {
          id: 'before',
          label: 'Before',
          badge: before.length,
          panel: (
            <BeforePanel
              jdId={jdId}
              rounds={rounds}
              evaluationTask={evaluationTask}
              coordinator={coordinator}
              before={before}
            />
          ),
        },
        {
          id: 'during',
          label: 'During',
          badge: view.isDemo ? 'demo' : during.length,
          panel: (
            <DuringPanel
              jdId={jdId}
              view={view}
              during={during}
              rounds={rounds}
              recordOutcomeAction={recordOutcomeAction}
            />
          ),
        },
        {
          id: 'after',
          label: 'After',
          badge: selectedCount + rejectedCount,
          panel: (
            <AfterPanel
              jdId={jdId}
              after={after}
              interviewsComplete={interviewsComplete}
              setDecisionAction={setDecisionAction}
              markCompleteAction={markCompleteAction}
            />
          ),
        },
      ]}
    />
  );
}

// ── BEFORE ────────────────────────────────────────────────────────────────

function BeforePanel({
  jdId,
  rounds,
  evaluationTask,
  coordinator,
  before,
}: {
  jdId: string;
  rounds: readonly InterviewRoundVM[];
  // Explicit `| undefined` so the optional props destructured in InterviewTabs
  // (which widen to include undefined) pass cleanly under exactOptionalPropertyTypes.
  evaluationTask: EvaluationTaskVM | undefined;
  coordinator: CoordinatorVM | undefined;
  before: readonly ShortlistedCandidateVM[];
}) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <p style={lead}>
        Everyone you shortlisted, with the note you wrote, their portfolio + CV + statement, and the slot they
        hold. This is your pre-interview prep sheet.
      </p>

      {/* What students were asked to prepare */}
      <div style={twoCol}>
        <div style={card}>
          <p style={cardLabel}>Interview rounds</p>
          {rounds.length === 0 ? (
            <p style={muted}>No rounds defined on this JD.</p>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 'var(--space-5)', display: 'grid', gap: 'var(--space-1)' }}>
              {rounds.map((r) => (
                <li key={r.round} style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
                  {r.focus}
                </li>
              ))}
            </ol>
          )}
        </div>
        <div style={card}>
          <p style={cardLabel}>Evaluation task</p>
          {evaluationTask ? (
            <>
              <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                {evaluationTask.title}
              </p>
              {evaluationTask.estimatedHours !== undefined && (
                <p style={muted}>~{evaluationTask.estimatedHours} h · students were asked to prepare this</p>
              )}
              {evaluationTask.briefMd && (
                <p style={{ ...muted, marginTop: 'var(--space-2)' }}>{evaluationTask.briefMd}</p>
              )}
              {evaluationTask.releaseAlignedToCycle && (
                <p style={{ ...muted, marginTop: 'var(--space-2)' }}>Release aligned to the cycle timeline.</p>
              )}
            </>
          ) : (
            <p style={muted}>No evaluation task attached to this JD.</p>
          )}
        </div>
      </div>

      {coordinator && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div>
            <p style={cardLabel}>Your student coordinator</p>
            <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
              {coordinator.name}
            </p>
            <p style={muted}>{coordinator.campus} · runs the on-the-day coordination for your interviews</p>
          </div>
          <StatusPill tone="info">Assigned</StatusPill>
        </div>
      )}

      {before.length === 0 ? (
        <Notice>
          No shortlisted candidates yet.{' '}
          <a href={`/recruiter/jds/${jdId}/applicants`} style={accentLink}>
            Shortlist some first.
          </a>
        </Notice>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {before.map((c) => (
            <div key={c.studentId} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <p style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                  {c.name}
                </p>
                <span style={muted}>{c.disciplineName}</span>
              </div>

              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                <span style={{ fontWeight: 'var(--fw-600)' }}>Your note: </span>
                {c.note}
              </p>

              {c.statementOfIntent && (
                <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                  <span style={{ fontWeight: 'var(--fw-600)' }}>Statement of intent: </span>
                  {c.statementOfIntent}
                </p>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                <ArtifactLink href={c.portfolioUrl} label={`Portfolio · ${c.portfolioHost}`} />
                {c.presentationUrl && <ArtifactLink href={c.presentationUrl} label="Presentation deck" />}
                {c.cvUrl ? (
                  <ArtifactLink href={c.cvUrl} label="CV (PDF)" />
                ) : (
                  c.cvAvailable && <span style={artifactMuted}>CV on file</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
                {c.slotLabel ? (
                  <StatusPill tone="success">Slot · {c.slotLabel}</StatusPill>
                ) : (
                  <StatusPill tone="warning">No slot assigned</StatusPill>
                )}
                {c.interviewers.length > 0 && (
                  <span style={muted}>Interviewers: {c.interviewers.join(', ')}</span>
                )}
              </div>
            </div>
          ))}
          <div>
            <a href={`/recruiter/jds/${jdId}/slots`} style={{ textDecoration: 'none' }}>
              <Button size="sm" variant="secondary">
                Manage slots + interviewers
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DURING ──────────────────────────────────────────────────────────────────

function DuringPanel({
  jdId,
  view,
  during,
  rounds,
  recordOutcomeAction,
}: {
  jdId: string;
  view: InterviewDayView;
  during: readonly DuringRowVM[];
  rounds: readonly InterviewRoundVM[];
  recordOutcomeAction: (formData: FormData) => void | Promise<void>;
}) {
  const roundCount = rounds.length || 1;
  const nowId = view.nowInterviewing?.studentId;
  const nowRow = nowId ? during.find((d) => d.entry.studentId === nowId) : undefined;

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', display: 'grid', gap: 'var(--space-4)' }}>
      {view.isDemo && (
        <div style={demoBanner}>
          DEMO MODE · sample data · no real candidates affected · book slots to see live interviews
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <p style={lead}>Live console — record each round outcome as you go.</p>
        {view.runningLateMinutes > 0 && <StatusPill tone="warning">Running {view.runningLateMinutes} min late</StatusPill>}
      </div>

      {/* Now interviewing */}
      {view.nowInterviewing ? (
        <div style={{ ...card, border: '2px solid var(--accent)' }}>
          <p style={cardLabel}>Now interviewing</p>
          <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' }}>
            {view.nowInterviewing.studentName}
          </p>
          <p style={muted}>
            {view.nowInterviewing.disciplineName} · {view.nowInterviewing.round} · {view.nowInterviewing.scheduledTime}
          </p>
          <OutcomeForm
            jdId={jdId}
            studentId={view.nowInterviewing.studentId}
            targetRound={nowRow?.nextRound ?? 1}
            roundCount={roundCount}
            recordOutcomeAction={recordOutcomeAction}
          />
        </div>
      ) : (
        <p style={notice}>No candidate currently in interview.</p>
      )}

      {/* Up next — each with its own outcome form + anonymized conflict signal */}
      <div>
        <p style={{ ...cardLabel, marginBottom: 'var(--space-2)' }}>Up next</p>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {view.upNext.length === 0 && <p style={notice}>Queue empty.</p>}
          {view.upNext.map((q) => {
            const row = during.find((d) => d.entry.studentId === q.studentId);
            return (
              <div key={q.studentId} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                      {q.studentName}
                    </p>
                    <p style={muted}>
                      {q.scheduledTime} · {q.round}
                    </p>
                  </div>
                  {q.conflict.inAnotherInterview ? (
                    <StatusPill tone="warning">
                      in another interview{q.conflict.etaBack ? ` · ETA ${q.conflict.etaBack}` : ''}
                    </StatusPill>
                  ) : (
                    <StatusPill tone="success">free</StatusPill>
                  )}
                </div>
                <OutcomeForm
                  jdId={jdId}
                  studentId={q.studentId}
                  targetRound={row?.nextRound ?? 1}
                  roundCount={roundCount}
                  recordOutcomeAction={recordOutcomeAction}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Per-candidate outcome form. Captures the evaluation score (0–10) + a note,
 * then one of Advance / Hold / Reject. Each verb is its own submit button
 * carrying `name="outcome"`, so the clicked button contributes the outcome
 * directly to the FormData (no client state-timing race). The server action
 * records the round + updates the candidate decision.
 */
function OutcomeForm({
  jdId,
  studentId,
  targetRound,
  roundCount,
  recordOutcomeAction,
}: {
  jdId: string;
  studentId: string;
  targetRound: number;
  roundCount: number;
  recordOutcomeAction: (formData: FormData) => void | Promise<void>;
}) {
  const roundForInput = Math.min(Math.max(targetRound, 1), roundCount);

  return (
    <form action={recordOutcomeAction} style={{ marginTop: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
      <input type="hidden" name="jdId" value={jdId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="round" value={roundForInput} />

      <p style={muted}>
        Round {roundForInput} of {roundCount}
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
          <span style={fieldLabel}>Score (0–10)</span>
          <input
            type="number"
            name="score"
            min={0}
            max={10}
            step={0.5}
            inputMode="decimal"
            aria-label={`Evaluation score for round ${roundForInput}`}
            style={{ ...inputStyle, width: '6rem' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 'var(--space-1)', flex: '1 1 220px' }}>
          <span style={fieldLabel}>Note</span>
          <input
            type="text"
            name="note"
            placeholder="What stood out this round"
            aria-label={`Note for round ${roundForInput}`}
            style={inputStyle}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Button type="submit" name="outcome" value="advance" size="sm">
          Advance
        </Button>
        <Button type="submit" name="outcome" value="hold" size="sm" variant="secondary">
          Hold
        </Button>
        <Button type="submit" name="outcome" value="reject" size="sm" variant="ghost">
          Reject
        </Button>
      </div>
    </form>
  );
}

// ── AFTER ─────────────────────────────────────────────────────────────────

function AfterPanel({
  jdId,
  after,
  interviewsComplete,
  setDecisionAction,
  markCompleteAction,
}: {
  jdId: string;
  after: InterviewTabsProps['after'];
  interviewsComplete: boolean;
  setDecisionAction: (formData: FormData) => void | Promise<void>;
  markCompleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const hasAny = after.selected.length + after.rejected.length + after.pending.length > 0;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <p style={lead}>
        Per-round results across everyone you interviewed. Confirm selected vs rejected, then mark the interviews
        complete to unlock Offers.
      </p>

      {!hasAny && (
        <Notice>
          No interview outcomes recorded yet. Record round outcomes in the <strong>During</strong> tab first.
        </Notice>
      )}

      <DecisionGroup
        title="Selected"
        tone="success"
        rows={after.selected}
        jdId={jdId}
        flipTo="rejected"
        flipLabel="Move to rejected"
        setDecisionAction={setDecisionAction}
        interviewsComplete={interviewsComplete}
      />
      <DecisionGroup
        title="Rejected"
        tone="danger"
        rows={after.rejected}
        jdId={jdId}
        flipTo="selected"
        flipLabel="Move to selected"
        setDecisionAction={setDecisionAction}
        interviewsComplete={interviewsComplete}
      />
      {after.pending.length > 0 && (
        <DecisionGroup
          title="On hold / pending"
          tone="warning"
          rows={after.pending}
          jdId={jdId}
          flipTo="selected"
          flipLabel="Mark selected"
          flipToAlt="rejected"
          flipLabelAlt="Mark rejected"
          setDecisionAction={setDecisionAction}
          interviewsComplete={interviewsComplete}
        />
      )}

      {/* Done & Dusted */}
      <div style={{ ...card, backgroundColor: 'var(--surface-panel)' }}>
        {interviewsComplete ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <StatusPill tone="success">Interviews complete</StatusPill>
            <p style={muted}>Offers are unlocked.</p>
            <a href={`/recruiter/jds/${jdId}/offers`} style={{ textDecoration: 'none', marginLeft: 'auto' }}>
              <Button size="sm">Go to offers →</Button>
            </a>
          </div>
        ) : (
          <form action={markCompleteAction} style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <input type="hidden" name="jdId" value={jdId} />
            <div>
              <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
                Mark interviews complete
              </p>
              <p style={muted}>
                This is final for this JD: it locks the After list and unlocks the Offers cascade. The selected
                candidates become the offer pool, in this order.
              </p>
            </div>
            <div>
              <Button type="submit" size="sm" disabled={after.selected.length === 0}>
                Done &amp; Dusted
              </Button>
              {after.selected.length === 0 && (
                <span style={{ ...muted, marginLeft: 'var(--space-3)' }}>
                  Select at least one candidate first.
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function DecisionGroup({
  title,
  tone,
  rows,
  jdId,
  flipTo,
  flipLabel,
  flipToAlt,
  flipLabelAlt,
  setDecisionAction,
  interviewsComplete,
}: {
  title: string;
  tone: 'success' | 'danger' | 'warning';
  rows: readonly AfterRowVM[];
  jdId: string;
  flipTo: RoundProgress['decision'];
  flipLabel: string;
  flipToAlt?: RoundProgress['decision'];
  flipLabelAlt?: string;
  setDecisionAction: (formData: FormData) => void | Promise<void>;
  interviewsComplete: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <StatusPill tone={tone}>{title}</StatusPill>
        <span style={muted}>
          {rows.length} {rows.length === 1 ? 'candidate' : 'candidates'}
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.studentId} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
              {r.name}
            </p>
            <span style={muted}>{r.disciplineName}</span>
          </div>

          {/* Per-round scores */}
          {r.perRound.length > 0 ? (
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
              {r.perRound.map((rr) => (
                <span key={rr.round} style={scoreChip}>
                  R{rr.round} · {rr.outcome}
                  {rr.score !== undefined ? ` · ${rr.score}/10` : ''}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ ...muted, marginTop: 'var(--space-2)' }}>No rounds recorded.</p>
          )}

          {/* Notes from rounds */}
          {r.perRound.some((rr) => rr.note) && (
            <ul style={{ margin: 'var(--space-2) 0 0', paddingLeft: 'var(--space-5)' }}>
              {r.perRound
                .filter((rr) => rr.note)
                .map((rr) => (
                  <li key={rr.round} style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
                    R{rr.round}: {rr.note}
                  </li>
                ))}
            </ul>
          )}

          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
            <span style={{ fontWeight: 'var(--fw-600)' }}>Shortlist note: </span>
            {r.note}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-3)', alignItems: 'center' }}>
            <ArtifactLink href={r.portfolioUrl} label={`Portfolio · ${r.portfolioHost}`} />
            {r.presentationUrl && <ArtifactLink href={r.presentationUrl} label="Presentation" />}
            {!interviewsComplete && (
              <span style={{ display: 'inline-flex', gap: 'var(--space-2)', marginLeft: 'auto' }}>
                <DecisionButton jdId={jdId} studentId={r.studentId} decision={flipTo} label={flipLabel} setDecisionAction={setDecisionAction} />
                {flipToAlt && flipLabelAlt && (
                  <DecisionButton jdId={jdId} studentId={r.studentId} decision={flipToAlt} label={flipLabelAlt} setDecisionAction={setDecisionAction} />
                )}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DecisionButton({
  jdId,
  studentId,
  decision,
  label,
  setDecisionAction,
}: {
  jdId: string;
  studentId: string;
  decision: RoundProgress['decision'];
  label: string;
  setDecisionAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={setDecisionAction} style={{ display: 'inline' }}>
      <input type="hidden" name="jdId" value={jdId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="decision" value={decision} />
      <Button type="submit" size="sm" variant="ghost">
        {label}
      </Button>
    </form>
  );
}

// ── shared bits ─────────────────────────────────────────────────────────────

function ArtifactLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={artifactLink}>
      {label} ↗
    </a>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <p style={notice}>{children}</p>;
}

const lead: CSSProperties = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-23)' };
const cardLabel: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};
const fieldLabel: CSSProperties = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)' };
const muted: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const card: CSSProperties = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
const twoCol: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' };
const inputStyle: CSSProperties = {
  minHeight: 'var(--input-min-height)',
  padding: 'var(--input-padding-y) var(--input-padding-x)',
  fontSize: 'var(--fs-14)',
  fontFamily: 'var(--ff-sans)',
  color: 'var(--input-fg)',
  backgroundColor: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--input-radius)',
};
const artifactLink: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textDecoration: 'none',
};
const artifactMuted: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const scoreChip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--surface-panel)',
  color: 'var(--text-strong)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
};
const accentLink: CSSProperties = { color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)' };
const demoBanner: CSSProperties = {
  backgroundColor: 'var(--amber-500)',
  color: 'var(--grey-900)',
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-2)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  textAlign: 'center',
};
const notice: CSSProperties = {
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  padding: 'var(--space-6)',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--radius-2)',
  border: '1px dashed var(--border-emphasized)',
  textAlign: 'center',
};
