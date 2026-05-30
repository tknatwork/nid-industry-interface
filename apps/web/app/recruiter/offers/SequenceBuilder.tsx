'use client';

import { useState, type CSSProperties } from 'react';
import { Button, SortableList, StatusPill } from '@nid/ui';

/**
 * SequenceBuilder — the recruiter drags the After-selected candidates into the
 * order their offers will float (Round 4 §D). Built on the generic `@nid/ui`
 * SortableList (vertical orientation).
 *
 * Client/server boundary: this island holds ONLY plain serializable props and
 * the injected `lockSequenceAction` server action. It never imports a store. It
 * persists exactly like InterviewerPicker — by rendering a `<form action={...}>`
 * with hidden inputs (here, one repeated `order` input per candidate in the
 * current drag order) and letting the server action read them with
 * `formData.getAll('order')`.
 *
 * Once `locked` is true the order is frozen: SortableList renders in its
 * `disabled` (static) mode and we show a numbered, non-draggable list with no
 * lock button — the canonical sequence can't be re-ordered (linearity).
 */

export interface SequenceCandidate {
  /** studentId — also the SortableList item `id`. */
  readonly id: string;
  readonly name: string;
  readonly disciplineName: string;
}

export interface SequenceBuilderProps {
  readonly jdId: string;
  /** Candidates in their initial order (the After-selected pool, or the locked order). */
  readonly candidates: readonly SequenceCandidate[];
  /** True once the float order is locked — renders the static numbered list. */
  readonly locked: boolean;
  /** Injected server action (from the page's `actions.ts`). */
  readonly lockSequenceAction: (formData: FormData) => void | Promise<void>;
}

export function SequenceBuilder({ jdId, candidates, locked, lockSequenceAction }: SequenceBuilderProps) {
  // Local drag order, controlled by SortableList. Keyed by id so we can re-derive
  // the ordered list from the canonical `candidates` prop after each reorder.
  const [order, setOrder] = useState<string[]>(() => candidates.map((c) => c.id));

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const ordered = order.map((id) => byId.get(id)).filter((c): c is SequenceCandidate => c !== undefined);

  if (locked) {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <StatusPill tone="success">Sequence locked</StatusPill>
          <span style={hint}>Offers float strictly in this order.</span>
        </div>
        <SortableList
          items={candidates}
          onReorder={() => undefined}
          disabled
          ariaLabel="Locked float sequence"
          renderItem={(c) => {
            const position = candidates.findIndex((x) => x.id === c.id) + 1;
            return <SequenceRow position={position} name={c.name} discipline={c.disciplineName} locked />;
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <p style={hint}>
        Drag to set the order offers float. The order must contain exactly your selected candidates.
      </p>
      <SortableList
        items={ordered}
        onReorder={setOrder}
        ariaLabel="Float sequence — drag to reorder"
        renderItem={(c, { dragging }) => {
          const position = order.indexOf(c.id) + 1;
          return (
            <SequenceRow position={position} name={c.name} discipline={c.disciplineName} dragging={dragging} />
          );
        }}
      />
      <form action={lockSequenceAction} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="hidden" name="jdId" value={jdId} />
        {order.map((studentId) => (
          <input key={studentId} type="hidden" name="order" value={studentId} />
        ))}
        <Button type="submit" disabled={ordered.length === 0}>
          Lock this sequence
        </Button>
        <span style={hint}>Locking is one-shot — you can&apos;t reorder afterwards.</span>
      </form>
    </div>
  );
}

function SequenceRow({
  position,
  name,
  discipline,
  dragging = false,
  locked = false,
}: {
  readonly position: number;
  readonly name: string;
  readonly discipline: string;
  readonly dragging?: boolean;
  readonly locked?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        backgroundColor: 'var(--surface-card)',
        border: `1px solid ${dragging ? 'var(--accent)' : 'var(--card-border)'}`,
        borderRadius: 'var(--radius-2)',
        boxShadow: dragging ? 'var(--shadow-2)' : 'none',
      }}
    >
      <span style={positionBadge}>{position}</span>
      <span style={{ display: 'grid' }}>
        <span style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{name}</span>
        <span style={hint}>{discipline}</span>
      </span>
      {!locked && (
        <span aria-hidden="true" style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: 'var(--fs-18)' }}>
          ⠿
        </span>
      )}
    </div>
  );
}

const hint: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const positionBadge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'var(--space-7)',
  height: 'var(--space-7)',
  flexShrink: 0,
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--surface-panel)',
  color: 'var(--text-strong)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
};
