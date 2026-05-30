'use client';

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

/**
 * Accordion — expand/collapse list of disclosure panels. Client component
 * (holds open/closed state + roving focus). Used by the Login FAQ (reusing the
 * `FAQ` data shape: `{ q, a }`) and optionally the Guidelines page.
 *
 * Reads only semantic tokens (`--surface-*`, `--text-*`, `--border-*`,
 * `--radius-*`, `--space-*`, `--motion-*`) — no primitives leak in here.
 *
 * Keyboard model follows the WAI-ARIA Accordion pattern:
 *   Enter / Space  — toggle the focused header (native <button> behaviour)
 *   ArrowDown      — move focus to the next header (wraps)
 *   ArrowUp        — move focus to the previous header (wraps)
 *   Home / End     — move focus to the first / last header
 * Each header is a real <button> with `aria-expanded` + `aria-controls`; each
 * panel is a labelled region, so screen readers announce state correctly.
 */

export interface AccordionItem {
  /**
   * Canonical header label. `q` is accepted as an alias so FAQ data
   * (`{ q, a }`) can be passed straight through; `title` wins when both exist.
   */
  readonly title?: ReactNode;
  /** Alias for {@link AccordionItem.title} — supports reusing FAQ `{ q }` data. */
  readonly q?: ReactNode;
  /** Panel body. `content` wins when both `content` and `a` are provided. */
  readonly content?: ReactNode;
  /** Alias for {@link AccordionItem.content} — supports reusing FAQ `{ a }` data. */
  readonly a?: ReactNode;
  /** Stable identity for default-open / controlled use. Falls back to the index. */
  readonly id?: string;
}

export interface AccordionProps {
  readonly items: ReadonlyArray<AccordionItem>;
  /** Allow several panels open at once. Default: single-open (others collapse). */
  readonly allowMultiple?: boolean;
  /** Keys (item `id`, else `String(index)`) that start expanded. */
  readonly defaultOpen?: ReadonlyArray<string>;
}

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const itemStyle: CSSProperties = {
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-2)',
  backgroundColor: 'var(--surface-card)',
  overflow: 'hidden',
};

const headerButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  width: '100%',
  padding: 'var(--space-4)',
  margin: 0,
  textAlign: 'left',
  fontFamily: 'var(--ff-sans)',
  fontSize: 'var(--fs-16)',
  fontWeight: 'var(--fw-600)',
  lineHeight: 1.4,
  color: 'var(--text-strong)',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color var(--motion-micro), color var(--motion-micro)',
};

const iconStyle: CSSProperties = {
  flexShrink: 0,
  width: '12px',
  height: '12px',
  color: 'var(--text-secondary)',
  transition: 'transform var(--motion-standard)',
};

const panelInnerStyle: CSSProperties = {
  padding: '0 var(--space-4) var(--space-4)',
  fontFamily: 'var(--ff-sans)',
  fontSize: 'var(--fs-16)',
  fontWeight: 'var(--fw-300)',
  lineHeight: 1.6,
  color: 'var(--text-secondary)',
};

function keyFor(item: AccordionItem, index: number): string {
  return item.id ?? String(index);
}

/** Chevron that rotates from ▸ (collapsed) to ▾ (expanded). Decorative only. */
function Chevron({ open }: { readonly open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      style={{ ...iconStyle, transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
      <path d="M4 2.5 7.5 6 4 9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Accordion({ items, allowMultiple = false, defaultOpen }: AccordionProps) {
  const baseId = useId();
  const [openKeys, setOpenKeys] = useState<ReadonlySet<string>>(() => new Set(defaultOpen ?? []));
  const headerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const keys = useMemo(() => items.map((item, index) => keyFor(item, index)), [items]);

  const toggle = useCallback(
    (key: string) => {
      setOpenKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          if (!allowMultiple) next.clear();
          next.add(key);
        }
        return next;
      });
    },
    [allowMultiple],
  );

  const focusHeader = useCallback((index: number) => {
    headerRefs.current[index]?.focus();
  }, []);

  const onHeaderKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const count = items.length;
      if (count === 0) return;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusHeader((index + 1) % count);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusHeader((index - 1 + count) % count);
          break;
        case 'Home':
          event.preventDefault();
          focusHeader(0);
          break;
        case 'End':
          event.preventDefault();
          focusHeader(count - 1);
          break;
        default:
          break;
      }
    },
    [items.length, focusHeader],
  );

  return (
    <ul style={listStyle}>
      {items.map((item, index) => {
        const key = keys[index] ?? String(index);
        const open = openKeys.has(key);
        const headerId = `${baseId}-header-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        const label = item.title ?? item.q;
        const body = item.content ?? item.a;

        return (
          <li key={key} style={itemStyle}>
            <h3 style={{ margin: 0 }}>
              <button
                ref={(node) => {
                  headerRefs.current[index] = node;
                }}
                type="button"
                id={headerId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(key)}
                onKeyDown={(event) => onHeaderKeyDown(event, index)}
                style={headerButtonStyle}
              >
                <span>{label}</span>
                <Chevron open={open} />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!open}
              style={{
                display: 'grid',
                gridTemplateRows: open ? '1fr' : '0fr',
                transition: 'grid-template-rows var(--motion-standard)',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={panelInnerStyle}>{body}</div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
