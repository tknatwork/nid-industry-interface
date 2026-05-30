'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { Button, StatusPill, SortableList } from '@nid/ui';
import type {
  RoundVM,
  SlotVM,
  PlanAssignmentVM,
  CandidateVM,
  InterviewerVM,
} from '~/components/workspace/interview-workspace-data';

/**
 * LegoTimeline (Round 4 §C Before) — the "Lego" interview-plan grid.
 *
 * A grid of time-slots × rounds. For each round, the recruiter drags their
 * shortlisted candidate cards into the time-slot lane; a candidate's position in
 * the lane maps them onto the slot at that index (slot[i] ⇄ candidate[i]).
 * Reordering with `@nid/ui`'s `SortableList` (mouse + keyboard) swaps who sits in
 * which slot. Each card shows the interviewer chips assigned to that cell.
 *
 * Persistence is store-free and forward-only: the component holds the per-round
 * candidate order in local state, derives the full `assignments[]` from it +
 * the slot columns, and serialises the WHOLE plan draft into a hidden `draft`
 * field. "Save layout" submits that to the injected `savePlanAction` (validated
 * server-side by `planDraftSchema`); "Lock plan" submits `lockPlanAction`.
 *
 * When `locked`, `SortableList` renders the identical cards as a STATIC list
 * (no DnD), and the save/lock controls are replaced by per-cell override forms
 * posting `overrideAssignmentAction` — the active-log overlay on the frozen
 * grid (the locked plan is never mutated in place).
 *
 * Receives plain serializable props only; persists exclusively via the injected
 * server-action forms. Styled with design tokens only.
 */

export interface LegoTimelineProps {
  readonly jdId: string;
  readonly locked: boolean;
  readonly durationMin: number;
  readonly rounds: readonly RoundVM[];
  readonly slots: readonly SlotVM[];
  readonly assignments: readonly PlanAssignmentVM[];
  readonly candidates: readonly CandidateVM[];
  readonly interviewers: readonly InterviewerVM[];
  readonly savePlanAction: (formData: FormData) => void | Promise<void>;
  readonly lockPlanAction: (formData: FormData) => void | Promise<void>;
  readonly overrideAssignmentAction: (formData: FormData) => void | Promise<void>;
}

interface CardItem {
  readonly id: string; // studentId — the sortable id
  readonly name: string;
  readonly disciplineName: string;
}

export function LegoTimeline({
  jdId,
  locked,
  durationMin,
  rounds,
  slots,
  assignments,
  candidates,
  interviewers,
  savePlanAction,
  lockPlanAction,
  overrideAssignmentAction,
}: LegoTimelineProps) {
  const candidateById = useMemo(
    () => new Map(candidates.map((c) => [c.studentId, c] as const)),
    [candidates],
  );
  const interviewerLabel = useMemo(
    () => new Map(interviewers.map((i) => [i.id, i.label] as const)),
    [interviewers],
  );

  // Per-round ordered candidate ids. Seed from existing assignments (ordered by
  // the candidate's slot index), falling back to the shortlist order so every
  // candidate is placeable even before any assignment exists.
  const initialOrder = useMemo<Record<number, string[]>>(() => {
    const slotIndex = new Map(slots.map((s, i) => [s.slotId, i] as const));
    const byRound: Record<number, string[]> = {};
    for (const r of rounds) {
      const placed = assignments
        .filter((a) => a.round === r.round)
        .slice()
        .sort((x, y) => (slotIndex.get(x.slotId) ?? 0) - (slotIndex.get(y.slotId) ?? 0))
        .map((a) => a.studentId);
      const placedSet = new Set(placed);
      const rest = candidates.map((c) => c.studentId).filter((id) => !placedSet.has(id));
      byRound[r.round] = [...placed, ...rest];
    }
    return byRound;
  }, [rounds, slots, assignments, candidates]);

  const [order, setOrder] = useState<Record<number, string[]>>(initialOrder);

  // Interviewers per cell are preserved from the incoming assignments (the
  // setup form / overrides own them); the timeline only moves people across slots.
  const interviewerIdsFor = useMemo(() => {
    const map = new Map<string, readonly string[]>();
    for (const a of assignments) map.set(`${a.round}::${a.studentId}`, a.interviewerIds);
    return map;
  }, [assignments]);

  /** Derive the full assignments[] from the current per-round order + slots. */
  const derivedAssignments = useMemo<PlanAssignmentVM[]>(() => {
    const out: PlanAssignmentVM[] = [];
    for (const r of rounds) {
      const ids = order[r.round] ?? [];
      ids.forEach((studentId, i) => {
        const slot = slots[i];
        if (!slot) return; // more candidates than slots → unplaced (no assignment)
        out.push({
          studentId,
          slotId: slot.slotId,
          round: r.round,
          interviewerIds: interviewerIdsFor.get(`${r.round}::${studentId}`) ?? [],
        });
      });
    }
    return out;
  }, [rounds, slots, order, interviewerIdsFor]);

  const draft = {
    jdId,
    durationMin,
    rounds: rounds.map((r) => ({ round: r.round, label: r.label })),
    slots: slots.map((s) => ({ slotId: s.slotId, startTime: s.startTime, durationMin })),
    assignments: derivedAssignments,
  };

  const hasSlots = slots.length > 0;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <p style={cardLabel}>Timeline</p>
        {locked ? (
          <StatusPill tone="info">Locked · drag disabled</StatusPill>
        ) : (
          <StatusPill tone="neutral">{slots.length} slots · drag to arrange</StatusPill>
        )}
      </div>

      {!hasSlots ? (
        <p style={notice}>
          No interview slots yet. Book slots for your shortlisted candidates first — the timeline arranges the slots
          you have.
        </p>
      ) : candidates.length === 0 ? (
        <p style={notice}>No shortlisted candidates to place. Shortlist candidates first.</p>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          {rounds.map((r) => {
            const ids = order[r.round] ?? [];
            const items: CardItem[] = ids.map((id) => {
              const c = candidateById.get(id);
              return { id, name: c?.name ?? id, disciplineName: c?.disciplineName ?? '' };
            });
            return (
              <div key={r.round} style={roundBlock}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <StatusPill tone="info">Round {r.round}</StatusPill>
                  <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)', fontWeight: 'var(--fw-500)' }}>{r.label}</span>
                </div>

                {/* Slot legend — index i in the lane maps onto this slot. */}
                <div style={slotLegend}>
                  {slots.map((s, i) => (
                    <span key={s.slotId} style={slotChip}>
                      #{i + 1} · {s.startTime}
                    </span>
                  ))}
                </div>

                <SortableList
                  items={items}
                  disabled={locked}
                  orientation="horizontal"
                  ariaLabel={`Round ${r.round} interview slots`}
                  onReorder={(orderedIds) =>
                    setOrder((prev) => ({ ...prev, [r.round]: orderedIds }))
                  }
                  renderItem={(item, { dragging }) => {
                    const idx = ids.indexOf(item.id);
                    const slot = slots[idx];
                    const chips = interviewerIdsFor.get(`${r.round}::${item.id}`) ?? [];
                    return (
                      <Card
                        name={item.name}
                        disciplineName={item.disciplineName}
                        slotLabel={slot ? `${slot.startTime}` : 'unplaced'}
                        placed={slot !== undefined}
                        dragging={dragging}
                        interviewerLabels={chips.map((id) => interviewerLabel.get(id) ?? id)}
                        locked={locked}
                        jdId={jdId}
                        round={r.round}
                        studentId={item.id}
                        slotId={slot?.slotId ?? ''}
                        slots={slots}
                        interviewers={interviewers}
                        currentInterviewerIds={chips}
                        overrideAssignmentAction={overrideAssignmentAction}
                      />
                    );
                  }}
                />
              </div>
            );
          })}

          {!locked && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <form action={savePlanAction} style={{ display: 'inline' }}>
                <input type="hidden" name="jdId" value={jdId} />
                <input type="hidden" name="draft" value={JSON.stringify(draft)} />
                <Button type="submit" size="sm" variant="secondary">
                  Save layout
                </Button>
              </form>
              <form action={lockPlanAction} style={{ display: 'inline' }}>
                <input type="hidden" name="jdId" value={jdId} />
                <Button type="submit" size="sm">
                  Lock plan → start interviews
                </Button>
              </form>
              <span style={hint}>Locking freezes the grid. Day-of changes become tracked overrides.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Card({
  name,
  disciplineName,
  slotLabel,
  placed,
  dragging,
  interviewerLabels,
  locked,
  jdId,
  round,
  studentId,
  slotId,
  slots,
  interviewers,
  currentInterviewerIds,
  overrideAssignmentAction,
}: {
  name: string;
  disciplineName: string;
  slotLabel: string;
  placed: boolean;
  dragging: boolean;
  interviewerLabels: readonly string[];
  locked: boolean;
  jdId: string;
  round: number;
  studentId: string;
  slotId: string;
  slots: readonly SlotVM[];
  interviewers: readonly InterviewerVM[];
  currentInterviewerIds: readonly string[];
  overrideAssignmentAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const selected = new Set(currentInterviewerIds);

  return (
    <div
      style={{
        ...cardItem,
        ...(dragging ? { boxShadow: 'var(--shadow-2)' } : {}),
        ...(placed ? {} : { borderStyle: 'dashed', opacity: 0.7 }),
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{name}</span>
        <StatusPill tone={placed ? 'success' : 'warning'}>{slotLabel}</StatusPill>
      </div>
      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>{disciplineName}</span>

      {interviewerLabels.length > 0 ? (
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
          {interviewerLabels.map((l) => (
            <span key={l} style={interviewerChip}>{l}</span>
          ))}
        </div>
      ) : (
        <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>No interviewers set</span>
      )}

      {/* Post-lock override: reassign this candidate's slot + interviewers. */}
      {locked && placed && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            style={overrideToggle}
          >
            {open ? 'Cancel override' : 'Override (day-of)'}
          </button>
          {open && (
            <form action={overrideAssignmentAction} style={overrideForm}>
              <input type="hidden" name="jdId" value={jdId} />
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="round" value={round} />
              <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
                <span style={fieldLabel}>Move to slot</span>
                <select name="slotId" defaultValue={slotId} style={selectStyle}>
                  {slots.map((s, i) => (
                    <option key={s.slotId} value={s.slotId}>
                      #{i + 1} · {s.startTime}
                    </option>
                  ))}
                </select>
              </label>
              {interviewers.length > 0 && (
                <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--space-1)' }}>
                  <legend style={fieldLabel}>Interviewers</legend>
                  {interviewers.map((iv) => (
                    <label key={iv.id} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="interviewerIds"
                        value={iv.id}
                        defaultChecked={selected.has(iv.id)}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-strong)' }}>{iv.label}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <Button type="submit" size="sm" variant="secondary">
                Apply override
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

const cardLabel: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
const fieldLabel: CSSProperties = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)' };
const hint: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const roundBlock: CSSProperties = {
  backgroundColor: 'var(--surface-panel)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
const slotLegend: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  flexWrap: 'wrap',
  marginBottom: 'var(--space-3)',
};
const slotChip: CSSProperties = {
  fontSize: 'var(--fs-12)',
  color: 'var(--text-secondary)',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  border: '1px dashed var(--border-default)',
};
const cardItem: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-1)',
  width: '200px',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-2)',
  padding: 'var(--space-3)',
};
const interviewerChip: CSSProperties = {
  fontSize: 'var(--fs-12)',
  color: 'var(--text-strong)',
  backgroundColor: 'var(--surface-panel)',
  padding: '2px var(--space-2)',
  borderRadius: 'var(--radius-full)',
};
const overrideToggle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  background: 'none',
  border: 'none',
  padding: 0,
  marginTop: 'var(--space-1)',
  cursor: 'pointer',
  textDecoration: 'underline',
  textAlign: 'left',
};
const overrideForm: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-2)',
  paddingTop: 'var(--space-2)',
  borderTop: '1px solid var(--border-default)',
};
const selectStyle: CSSProperties = {
  minHeight: 'var(--input-min-height)',
  padding: 'var(--input-padding-y) var(--input-padding-x)',
  fontSize: 'var(--fs-12)',
  color: 'var(--input-fg)',
  backgroundColor: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--input-radius)',
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
