'use client';

import { useState, type CSSProperties } from 'react';
import { DISCIPLINES } from '~/lib/public-content';

/**
 * BentoDisciplineGrid — a bento (mixed-span) grid of all 20 NID disciplines
 * (plan §E). Each tile shows the discipline name + summary at rest and
 * hover-/focus-reveals its `whatTheyDo` points. Every tile themes to its
 * discipline colour via `data-discipline` (the semantic token layer rewrites
 * `--accent` per theme), so the grid reads as a colourful taxonomy at a glance.
 *
 * Client component because the reveal is interactive: it tracks the
 * hovered/focused tile so the points can both fade up on pointer hover AND be
 * shown on keyboard focus (hover alone would be inaccessible). The reveal is a
 * pure opacity/translate transition driven by design-token motion, so the
 * global `prefers-reduced-motion` rule neutralises it for users who opt out.
 *
 * Each tile links to its long-form section in the one-page brochure below
 * (`/disciplines#<slug>`) rather than a separate per-discipline page, matching
 * the §E "one long scrollable brochure" model. The dedicated
 * `/disciplines/<slug>` page still exists for deep links and resolves the same
 * content.
 */

/**
 * Bento span recipe — a repeating rhythm of feature tiles (2×2 / 2×1 / 1×2)
 * interleaved with single tiles, keyed by index modulo the pattern length. With
 * 20 disciplines this yields a balanced, non-uniform grid on wide viewports and
 * collapses to a single column on small ones (the spans are no-ops at 1 column).
 */
type Span = { readonly col: number; readonly row: number };

const SPAN_PATTERN: readonly Span[] = [
  { col: 2, row: 2 }, // 0 — hero feature
  { col: 1, row: 1 }, // 1
  { col: 1, row: 1 }, // 2
  { col: 2, row: 1 }, // 3 — wide
  { col: 1, row: 2 }, // 4 — tall
  { col: 1, row: 1 }, // 5
  { col: 1, row: 1 }, // 6
  { col: 2, row: 1 }, // 7 — wide
  { col: 1, row: 1 }, // 8
  { col: 1, row: 1 }, // 9
];

function spanFor(index: number): Span {
  return SPAN_PATTERN[index % SPAN_PATTERN.length] ?? { col: 1, row: 1 };
}

export function BentoDisciplineGrid() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  return (
    <ul style={gridStyle} aria-label="All twenty NID design disciplines">
      {DISCIPLINES.map((d, index) => {
        const span = spanFor(index);
        const isFeature = span.col >= 2 && span.row >= 2;
        const active = activeSlug === d.slug;
        return (
          <li
            key={d.slug}
            data-discipline={d.theme}
            style={{
              gridColumn: `span ${span.col}`,
              gridRow: `span ${span.row}`,
              minWidth: 0,
            }}
          >
            <a
              href={`#${d.slug}`}
              style={tileStyle(active)}
              onMouseEnter={() => setActiveSlug(d.slug)}
              onMouseLeave={() => setActiveSlug((s) => (s === d.slug ? null : s))}
              onFocus={() => setActiveSlug(d.slug)}
              onBlur={() => setActiveSlug((s) => (s === d.slug ? null : s))}
            >
              <span style={dotStyle} aria-hidden="true" />
              <span style={programmeStyle}>{d.programme}</span>
              <span style={isFeature ? titleFeatureStyle : titleStyle}>{d.name}</span>
              <span style={summaryStyle}>{d.summary}</span>

              {/* Hover/focus reveal: what graduates actually do. */}
              <span style={revealStyle(active)} aria-hidden={!active}>
                <span style={revealLabelStyle}>What they do</span>
                <span style={revealListStyle}>
                  {d.whatTheyDo.map((w) => (
                    <span key={w} style={revealItemStyle}>
                      {w}
                    </span>
                  ))}
                </span>
              </span>

              <span style={cueStyle}>Read in brochure ↓</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

const gridStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gridAutoRows: 'minmax(168px, auto)',
  gridAutoFlow: 'dense',
  gap: 'var(--space-4)',
};

function tileStyle(active: boolean): CSSProperties {
  return {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
    padding: 'var(--card-padding)',
    backgroundColor: 'var(--surface-card)',
    borderRadius: 'var(--radius-4)',
    border: '1px solid var(--border-default)',
    borderTop: '4px solid var(--accent)',
    boxShadow: active ? 'var(--shadow-3)' : 'var(--shadow-1)',
    textDecoration: 'none',
    overflow: 'hidden',
    transform: active ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'box-shadow var(--motion-standard), transform var(--motion-standard)',
  };
}

const dotStyle: CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--accent)',
  flex: '0 0 auto',
};

const programmeStyle: CSSProperties = {
  marginTop: 'var(--space-3)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
};

const titleStyle: CSSProperties = {
  marginTop: 'var(--space-1)',
  fontSize: 'var(--fs-20)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
};

const titleFeatureStyle: CSSProperties = {
  ...titleStyle,
  fontSize: 'var(--fs-24)',
  lineHeight: 'var(--lh-28)',
};

const summaryStyle: CSSProperties = {
  marginTop: 'var(--space-2)',
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-18)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-secondary)',
};

/**
 * The reveal panel. At rest it is collapsed (zero max-height, faded, nudged
 * down); on active it expands and fades up. `pointerEvents: none` keeps it from
 * intercepting the link's own hover. Under reduced-motion the transitions are
 * neutralised globally, so it simply appears/disappears.
 */
function revealStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    marginTop: active ? 'var(--space-3)' : 0,
    maxHeight: active ? '320px' : 0,
    opacity: active ? 1 : 0,
    transform: active ? 'translateY(0)' : 'translateY(6px)',
    overflow: 'hidden',
    pointerEvents: 'none',
    transition:
      'max-height var(--motion-standard), opacity var(--motion-standard), transform var(--motion-standard), margin-top var(--motion-standard)',
  };
}

const revealLabelStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
};

const revealListStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-1)',
  marginTop: 'var(--space-2)',
};

const revealItemStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  lineHeight: 'var(--lh-18)',
  fontWeight: 'var(--fw-400)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--surface-panel)',
  borderRadius: 'var(--radius-full)',
  padding: 'var(--space-1) var(--space-3)',
};

const cueStyle: CSSProperties = {
  marginTop: 'auto',
  paddingTop: 'var(--space-3)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
};
