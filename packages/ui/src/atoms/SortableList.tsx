'use client';

import { useCallback, type CSSProperties, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * SortableList — a generic, keyboard-accessible drag-to-reorder list built on
 * `@dnd-kit`. One primitive powers two Round 4 surfaces: the interview "Lego"
 * timeline (reorder/assign slots) and the offer float-sequence builder (set the
 * order candidates receive offers). Both want the same reorder mechanics with
 * different cell rendering, so this atom owns the DnD wiring and delegates all
 * presentation to a render prop.
 *
 * Items are any objects carrying a stable string `id`. On drop, the new order is
 * reported as an array of ids via `onReorder` — the parent stays the source of
 * truth and persists the order through its own injected server action (this atom
 * never imports a store). The component is controlled: render the `items` in the
 * order the parent holds, and re-render with the new order after `onReorder`.
 *
 * Accessibility: a `PointerSensor` (with a small activation distance so clicks
 * inside cells still work) handles mouse/touch; a `KeyboardSensor` makes every
 * item reorderable with the keyboard alone (Space to lift, Arrow keys to move,
 * Space to drop) using @dnd-kit's sortable coordinate getter. `orientation`
 * picks the matching sorting strategy so arrow-key movement follows the visual
 * axis.
 *
 * `disabled` renders the exact same `renderItem` output as a plain static list
 * with no DnD context — used once a stage is locked (e.g. a frozen sequence)
 * so the locked view and the editable view stay visually identical.
 *
 * Reads only semantic design tokens (`var(--...)`); the cell chrome is supplied
 * by `renderItem`, keeping this atom presentation-light.
 */

export interface SortableRenderArgs {
  /** True while this item is the one being dragged. */
  readonly dragging: boolean;
}

export interface SortableListProps<T extends { id: string }> {
  /** Items in their current order (controlled). */
  readonly items: readonly T[];
  /** Called with the full new order (as ids) after a drag completes. */
  readonly onReorder: (orderedIds: string[]) => void;
  /** Renders a single item's content; receives drag state for styling. */
  readonly renderItem: (item: T, args: SortableRenderArgs) => ReactNode;
  /** When true, render a static, non-draggable list. Defaults to false. */
  readonly disabled?: boolean;
  /** Layout/drag axis. Defaults to `'vertical'`. */
  readonly orientation?: 'vertical' | 'horizontal';
  /** Accessible label for the reorderable list region. */
  readonly ariaLabel: string;
}

function listStyle(orientation: 'vertical' | 'horizontal'): CSSProperties {
  return {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
    gap: 'var(--space-2)',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  };
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  disabled = false,
  orientation = 'vertical',
  ariaLabel,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over === null || active.id === over.id) return;
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      onReorder(arrayMove([...items], oldIndex, newIndex).map((item) => item.id));
    },
    [items, onReorder],
  );

  // Locked view: identical markup, no DnD context or sortable hooks.
  if (disabled) {
    return (
      <ul aria-label={ariaLabel} style={listStyle(orientation)}>
        {items.map((item) => (
          <li key={item.id} style={{ display: 'block' }}>
            {renderItem(item, { dragging: false })}
          </li>
        ))}
      </ul>
    );
  }

  const strategy =
    orientation === 'horizontal' ? horizontalListSortingStrategy : verticalListSortingStrategy;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={strategy}>
        <ul aria-label={ariaLabel} style={listStyle(orientation)}>
          {items.map((item) => (
            <SortableRow key={item.id} item={item} renderItem={renderItem} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow<T extends { id: string }>({
  item,
  renderItem,
}: {
  readonly item: T;
  readonly renderItem: (item: T, args: SortableRenderArgs) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  // `transform`/`transition` from @dnd-kit are `string | undefined`; under
  // exactOptionalPropertyTypes we spread them only when defined rather than
  // assigning `undefined` to the optional CSSProperties keys.
  const transformCss = CSS.Transform.toString(transform);
  const style: CSSProperties = {
    display: 'block',
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : 0,
    cursor: 'grab',
    touchAction: 'none',
    ...(transformCss != null ? { transform: transformCss } : {}),
    ...(transition != null ? { transition } : {}),
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderItem(item, { dragging: isDragging })}
    </li>
  );
}
