'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

/**
 * Tabs — shared tab bar + panels primitive.
 *
 * Two modes (chosen per the Round 2 plan, which reuses this in the Disciplines
 * tabbed brochure, the JD wizard, and the Interview Before/During/After flow):
 *
 *  1. Panel mode (default) — a roving-focus ARIA tablist that swaps `panel`
 *     content. Controlled (`value` + `onValueChange`) or uncontrolled
 *     (`defaultValue`). Each item supplies its own `panel` node.
 *
 *  2. Scroll-spy mode (`scrollSpy`) — the tab bar links to sibling sections
 *     already on the page (each item carries a `targetId`). Clicking smooth-
 *     scrolls to that section; the active tab follows scroll position via an
 *     IntersectionObserver. Used for the one long Disciplines brochure with a
 *     sticky 20-tab bar. In this mode the component renders only the bar — the
 *     sections are authored by the caller — so `panel` is ignored.
 *
 * Client component: it owns selection state, keyboard navigation, and (in
 * scroll-spy mode) a scroll observer. Styled with design tokens only, matching
 * the other atoms (Button, StatusPill, Field).
 */

export type TabsVariant = 'underline' | 'pill';

export interface TabItem {
  /** Stable key + the value reported by `onValueChange`. */
  readonly id: string;
  /** Visible label. */
  readonly label: ReactNode;
  /** Optional small count/badge rendered after the label (e.g. JD filter counts). */
  readonly badge?: ReactNode;
  /** Disable selection of this tab. */
  readonly disabled?: boolean;
  /**
   * Panel content for panel mode. Ignored in scroll-spy mode.
   * Omit to render the tab bar alone (caller places panels elsewhere).
   */
  readonly panel?: ReactNode;
  /**
   * Scroll-spy mode only: the `id` of the section this tab points at.
   * Required for every item when `scrollSpy` is set.
   */
  readonly targetId?: string;
}

interface TabsBaseProps {
  readonly items: ReadonlyArray<TabItem>;
  /** Visual treatment of the bar. Default `underline`. */
  readonly variant?: TabsVariant;
  /** Accessible name for the tablist. */
  readonly 'aria-label'?: string;
  /** Make the bar sticky to the top of its scroll container (handy for scroll-spy). */
  readonly sticky?: boolean;
  /** Distance from the top when sticky / the scroll-margin used when scrolling to a section. Default `0`. */
  readonly stickyOffset?: number;
  /** Extra style merged onto the outer wrapper. */
  readonly style?: CSSProperties;
  /** Extra style merged onto the tab bar (the `tablist`). */
  readonly barStyle?: CSSProperties;
}

interface TabsPanelModeProps extends TabsBaseProps {
  readonly scrollSpy?: false;
  /** Uncontrolled initial selection (defaults to the first non-disabled item). */
  readonly defaultValue?: string;
  /** Controlled selection. */
  readonly value?: string;
  /** Fires on selection change (click or keyboard). */
  readonly onValueChange?: (id: string) => void;
}

interface TabsScrollSpyProps extends TabsBaseProps {
  readonly scrollSpy: true;
  /**
   * IntersectionObserver `rootMargin`. Defaults to a top-biased band so the
   * tab flips when a section reaches the upper third of the viewport.
   */
  readonly spyRootMargin?: string;
  /** Fires when the spied-on active section changes. */
  readonly onActiveChange?: (id: string) => void;
}

export type TabsProps = TabsPanelModeProps | TabsScrollSpyProps;

function firstEnabledId(items: ReadonlyArray<TabItem>): string {
  const enabled = items.find((item) => !item.disabled);
  return enabled?.id ?? items[0]?.id ?? '';
}

const tabBaseStyle: CSSProperties = {
  appearance: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  border: 'none',
  background: 'none',
  margin: 0,
  fontFamily: 'var(--ff-sans)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'color var(--motion-micro), background-color var(--motion-micro), border-color var(--motion-micro)',
};

function tabStyle(variant: TabsVariant, active: boolean, disabled: boolean): CSSProperties {
  const tone: CSSProperties =
    variant === 'pill'
      ? {
          paddingBlock: 'var(--space-2)',
          paddingInline: 'var(--space-4)',
          borderRadius: 'var(--radius-full)',
          backgroundColor: active ? 'var(--accent)' : 'var(--surface-card)',
          color: active ? 'var(--accent-text)' : 'var(--text-primary)',
          border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
        }
      : {
          paddingBlock: 'var(--space-3)',
          paddingInline: 'var(--space-1)',
          color: active ? 'var(--accent)' : 'var(--text-primary)',
          borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        };

  return {
    ...tabBaseStyle,
    ...tone,
    ...(disabled ? { cursor: 'not-allowed', opacity: 0.45 } : {}),
  };
}

function badgeStyle(active: boolean, variant: TabsVariant): CSSProperties {
  const onAccent = active && variant === 'pill';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '1.5em',
    paddingInline: 'var(--space-1)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--fs-12)',
    fontWeight: 'var(--fw-600)',
    lineHeight: 1.4,
    backgroundColor: onAccent ? 'rgb(255 255 255 / 0.25)' : 'var(--surface-panel)',
    color: onAccent ? 'var(--accent-text)' : 'var(--text-secondary)',
  };
}

/**
 * Panel-mode tab bar + panels. Roving tabindex, arrow-key navigation, Home/End.
 */
function PanelTabs(props: TabsPanelModeProps) {
  const { items, variant = 'underline', sticky = false, stickyOffset = 0, style, barStyle } = props;
  const ariaLabel = props['aria-label'];
  const reactId = useId();

  const fallback = useMemo(() => firstEnabledId(items), [items]);
  const isControlled = props.value !== undefined;
  const [internal, setInternal] = useState<string>(props.defaultValue ?? fallback);
  // SAFE-CAST: isControlled guarantees props.value is defined on this branch.
  const selected = isControlled ? (props.value as string) : internal;

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = useCallback(
    (id: string) => {
      if (!isControlled) setInternal(id);
      props.onValueChange?.(id);
    },
    [isControlled, props],
  );

  const focusTab = useCallback((index: number) => {
    tabRefs.current[index]?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const count = items.length;
      if (count === 0) return;

      const step = (dir: 1 | -1): void => {
        event.preventDefault();
        let next = index;
        for (let i = 0; i < count; i += 1) {
          next = (next + dir + count) % count;
          const candidate = items[next];
          if (candidate && !candidate.disabled) {
            select(candidate.id);
            focusTab(next);
            return;
          }
        }
      };

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          step(1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          step(-1);
          break;
        case 'Home': {
          event.preventDefault();
          const firstIdx = items.findIndex((item) => !item.disabled);
          if (firstIdx >= 0) {
            const target = items[firstIdx];
            if (target) {
              select(target.id);
              focusTab(firstIdx);
            }
          }
          break;
        }
        case 'End': {
          event.preventDefault();
          for (let i = count - 1; i >= 0; i -= 1) {
            const target = items[i];
            if (target && !target.disabled) {
              select(target.id);
              focusTab(i);
              break;
            }
          }
          break;
        }
        default:
          break;
      }
    },
    [items, select, focusTab],
  );

  return (
    <div style={style ? { ...style } : undefined}>
      <div
        role="tablist"
        {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
        style={{
          display: 'flex',
          gap: variant === 'pill' ? 'var(--space-2)' : 'var(--space-5)',
          alignItems: 'center',
          flexWrap: variant === 'pill' ? 'wrap' : 'nowrap',
          overflowX: variant === 'pill' ? 'visible' : 'auto',
          borderBottom: variant === 'underline' ? '1px solid var(--border-default)' : undefined,
          ...(sticky
            ? {
                position: 'sticky',
                top: `${stickyOffset}px`,
                zIndex: 5,
                backgroundColor: 'var(--surface-page)',
              }
            : {}),
          ...barStyle,
        }}
      >
        {items.map((item, index) => {
          const active = item.id === selected;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${reactId}-tab-${item.id}`}
              aria-selected={active}
              aria-controls={`${reactId}-panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              disabled={item.disabled ?? false}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              onClick={() => {
                if (!item.disabled) select(item.id);
              }}
              onKeyDown={(event) => onKeyDown(event, index)}
              style={tabStyle(variant, active, item.disabled ?? false)}
            >
              {item.label}
              {item.badge !== undefined && <span style={badgeStyle(active, variant)}>{item.badge}</span>}
            </button>
          );
        })}
      </div>

      {items.map((item) => {
        const active = item.id === selected;
        if (item.panel === undefined) return null;
        return (
          <div
            key={item.id}
            role="tabpanel"
            id={`${reactId}-panel-${item.id}`}
            aria-labelledby={`${reactId}-tab-${item.id}`}
            hidden={!active}
            tabIndex={0}
            style={{ paddingBlockStart: 'var(--space-5)', outline: 'none' }}
          >
            {active ? item.panel : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Scroll-spy tab bar. Renders anchors to sibling sections; the active tab
 * follows the section currently in view. Sections are authored by the caller
 * (each must carry the matching `targetId`).
 */
function ScrollSpyTabs(props: TabsScrollSpyProps) {
  const {
    items,
    variant = 'underline',
    sticky = true,
    stickyOffset = 0,
    style,
    barStyle,
    spyRootMargin,
    onActiveChange,
  } = props;
  const ariaLabel = props['aria-label'];

  const targetIds = useMemo(
    () => items.map((item) => item.targetId).filter((id): id is string => Boolean(id)),
    [items],
  );

  const [activeId, setActiveId] = useState<string>(targetIds[0] ?? '');
  const activeRef = useRef<string>(activeId);

  const setActive = useCallback(
    (id: string) => {
      if (id === activeRef.current) return;
      activeRef.current = id;
      setActiveId(id);
      onActiveChange?.(id);
    },
    [onActiveChange],
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const sections = targetIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // Track how much of each section is visible; the most-visible one wins.
    const ratios = new Map<string, number>();
    const rootMargin = spyRootMargin ?? `-${stickyOffset + 8}px 0px -55% 0px`;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestId = activeRef.current;
        let bestRatio = -1;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestRatio > 0 && bestId) setActive(bestId);
      },
      { rootMargin, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    for (const section of sections) observer.observe(section);
    return () => {
      observer.disconnect();
    };
  }, [targetIds, spyRootMargin, stickyOffset, setActive]);

  const onAnchorClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
      const target = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
      if (!target) return; // let the native hash jump handle it
      event.preventDefault();
      const reduce =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const top = target.getBoundingClientRect().top + window.scrollY - stickyOffset - 8;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
      setActive(targetId);
    },
    [stickyOffset, setActive],
  );

  return (
    <div
      role="navigation"
      {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
      style={{
        display: 'flex',
        gap: variant === 'pill' ? 'var(--space-2)' : 'var(--space-5)',
        alignItems: 'center',
        flexWrap: variant === 'pill' ? 'wrap' : 'nowrap',
        overflowX: variant === 'pill' ? 'visible' : 'auto',
        borderBottom: variant === 'underline' ? '1px solid var(--border-default)' : undefined,
        ...(sticky
          ? {
              position: 'sticky',
              top: `${stickyOffset}px`,
              zIndex: 5,
              backgroundColor: 'var(--surface-page)',
            }
          : {}),
        ...style,
        ...barStyle,
      }}
    >
      {items.map((item) => {
        const target = item.targetId ?? '';
        const active = target !== '' && target === activeId;
        return (
          <a
            key={item.id}
            href={`#${target}`}
            aria-current={active ? 'true' : undefined}
            onClick={(event) => {
              if (item.disabled) {
                event.preventDefault();
                return;
              }
              onAnchorClick(event, target);
            }}
            style={tabStyle(variant, active, item.disabled ?? false)}
          >
            {item.label}
            {item.badge !== undefined && <span style={badgeStyle(active, variant)}>{item.badge}</span>}
          </a>
        );
      })}
    </div>
  );
}

export function Tabs(props: TabsProps) {
  if (props.scrollSpy) return <ScrollSpyTabs {...props} />;
  return <PanelTabs {...props} />;
}
