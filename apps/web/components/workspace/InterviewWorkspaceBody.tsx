'use client';

import type { CSSProperties } from 'react';
import { StatusPill } from '@nid/ui';
import type { InterviewWorkspaceVM } from './interview-workspace-data';
import { PlanSetupForm } from '~/components/interview/PlanSetupForm';
import { LegoTimeline } from '~/components/interview/LegoTimeline';
import { DuringRounds } from '~/components/interview/DuringRounds';
import { AfterTally } from '~/components/interview/AfterTally';

/**
 * Interview workspace body (Round 4 §C) — the Before / During / After phase
 * switch for one JD.
 *
 * The active phase is driven by the URL (`?phase=`) resolved against the
 * pipeline stage on the server, NOT by local-only state: the phase tabs are
 * plain links that swap `?phase=` (preserving `?jd=`), so a deep link lands on
 * the right phase and the back/forward buttons work. Crucially this means the
 * stage-gate is real — you can't reveal a later phase's edit affordances by
 * clicking a client-only tab; the gating reads `vm.stage` from the source of
 * truth.
 *
 * This client island receives a fully serialized `vm` (assembled server-side by
 * `interview-workspace-data.ts`) plus the workspace server actions, which it
 * threads down to the per-phase forms. It value-imports NO store — every island
 * below persists only by rendering a `<form action={injectedServerAction}>`.
 */

export type Phase = 'before' | 'during' | 'after';

export interface InterviewWorkspaceBodyProps {
  readonly vm: InterviewWorkspaceVM;
  /** Active phase from `?phase=`. When absent, derived from the pipeline stage. */
  readonly phase?: string;
  readonly savePlanAction: (formData: FormData) => void | Promise<void>;
  readonly lockPlanAction: (formData: FormData) => void | Promise<void>;
  readonly overrideAssignmentAction: (formData: FormData) => void | Promise<void>;
  readonly recordOutcomeAction: (formData: FormData) => void | Promise<void>;
  readonly advanceRoundAction: (formData: FormData) => void | Promise<void>;
  readonly lockSelectionAction: (formData: FormData) => void | Promise<void>;
  readonly recordTaskScoresAction: (formData: FormData) => void | Promise<void>;
  readonly sendLetterAction: (formData: FormData) => void | Promise<void>;
  readonly setTransportAction: (formData: FormData) => void | Promise<void>;
}

/** Default phase for a stage when `?phase=` is absent — follows the journey. */
function defaultPhaseFor(vm: InterviewWorkspaceVM): Phase {
  switch (vm.stage) {
    case 'published':
    case 'shortlisting':
      return 'before';
    case 'plan-locked':
    case 'interviewing':
      return 'during';
    default:
      return 'after';
  }
}

function normalizePhase(raw: string | undefined, vm: InterviewWorkspaceVM): Phase {
  if (raw === 'before' || raw === 'during' || raw === 'after') return raw;
  return defaultPhaseFor(vm);
}

const PHASES: ReadonlyArray<{ id: Phase; label: string }> = [
  { id: 'before', label: 'Before · plan' },
  { id: 'during', label: 'During · rounds' },
  { id: 'after', label: 'After · tally' },
];

export function InterviewWorkspaceBody(props: InterviewWorkspaceBodyProps) {
  const { vm, phase } = props;
  const active = normalizePhase(phase, vm);

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      {/* Stage banner — the source-of-truth pipeline stage for this JD. */}
      <div style={stageBar}>
        <span style={cardLabel}>{vm.jdTitle}</span>
        <StatusPill tone={stageTone(active)}>{stageLabel(vm.stage)}</StatusPill>
        {vm.planLocked && <StatusPill tone="info">Plan locked</StatusPill>}
        {vm.interviewsComplete && <StatusPill tone="success">Interviews complete</StatusPill>}
      </div>

      {/* Phase tabs — real links that swap ?phase= (preserve ?jd=). */}
      <nav aria-label="Interview phase" style={tabRow}>
        {PHASES.map((p) => {
          const isActive = p.id === active;
          return (
            <a
              key={p.id}
              href={`/recruiter/interviews?jd=${encodeURIComponent(vm.jdId)}&phase=${p.id}`}
              aria-current={isActive ? 'page' : undefined}
              style={{
                ...tabStyle,
                ...(isActive ? tabActiveStyle : {}),
              }}
            >
              {p.label}
            </a>
          );
        })}
      </nav>

      {active === 'before' && (
        <BeforePhase {...props} />
      )}
      {active === 'during' && (
        <DuringRounds
          jdId={vm.jdId}
          rounds={vm.rounds}
          currentRound={vm.currentRound}
          finalRound={vm.finalRound}
          during={vm.during}
          tally={vm.tally}
          transport={vm.transport}
          recordOutcomeAction={props.recordOutcomeAction}
          advanceRoundAction={props.advanceRoundAction}
          setTransportAction={props.setTransportAction}
        />
      )}
      {active === 'after' && (
        <AfterTally
          jdId={vm.jdId}
          positions={vm.positions}
          tally={vm.tally}
          finalRound={vm.finalRound}
          interviewsComplete={vm.interviewsComplete}
          selectedCount={vm.selectedCount}
          hasTask={vm.hasTask}
          {...(vm.taskTitle ? { taskTitle: vm.taskTitle } : {})}
          {...(vm.letter ? { letter: vm.letter } : {})}
          lockSelectionAction={props.lockSelectionAction}
          recordTaskScoresAction={props.recordTaskScoresAction}
          sendLetterAction={props.sendLetterAction}
        />
      )}
    </div>
  );
}

/** Before phase: setup form (when editable) + the Lego timeline. */
function BeforePhase({
  vm,
  savePlanAction,
  lockPlanAction,
  overrideAssignmentAction,
}: InterviewWorkspaceBodyProps) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <p style={lead}>
        Compose the interview plan: set a per-round duration, confirm the rounds (seeded from this JD), and drag your
        shortlisted candidates onto the time-slot grid. Lock it when you are ready — after that the grid freezes and
        day-of changes become tracked overrides.
      </p>

      {vm.planEditable && !vm.planLocked && (
        <PlanSetupForm
          jdId={vm.jdId}
          durationMin={vm.durationMin}
          rounds={vm.rounds}
          slots={vm.slots}
          assignments={vm.assignments}
          savePlanAction={savePlanAction}
        />
      )}

      <LegoTimeline
        jdId={vm.jdId}
        locked={vm.planLocked || !vm.planEditable}
        rounds={vm.rounds}
        slots={vm.slots}
        assignments={vm.assignments}
        candidates={vm.candidates}
        interviewers={vm.interviewers}
        savePlanAction={savePlanAction}
        lockPlanAction={lockPlanAction}
        overrideAssignmentAction={overrideAssignmentAction}
        durationMin={vm.durationMin}
      />
    </div>
  );
}

function stageLabel(stage: InterviewWorkspaceVM['stage']): string {
  const labels: Record<InterviewWorkspaceVM['stage'], string> = {
    published: 'Published',
    shortlisting: 'Shortlisting',
    'plan-locked': 'Plan locked',
    interviewing: 'Interviewing',
    tallied: 'Tallied',
    'offer-sequencing': 'Offers',
    'letters-out': 'Letters out',
  };
  return labels[stage];
}

function stageTone(phase: Phase): 'info' | 'success' | 'warning' {
  if (phase === 'after') return 'success';
  if (phase === 'during') return 'warning';
  return 'info';
}

const stageBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  flexWrap: 'wrap',
};
const tabRow: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
  borderBottom: '1px solid var(--border-default)',
  paddingBottom: 'var(--space-2)',
};
const tabStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-default)',
};
const tabActiveStyle: CSSProperties = {
  color: 'var(--text-strong)',
  backgroundColor: 'color-mix(in oklch, var(--accent), white 86%)',
  borderColor: 'var(--accent)',
};
const lead: CSSProperties = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-23)' };
const cardLabel: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
};
