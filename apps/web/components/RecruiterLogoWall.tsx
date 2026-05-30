'use client';

import { type CSSProperties } from 'react';
import { Marquee } from '@nid/ui';
import * as simpleIcons from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';
import { RECRUITER_LOGOS, type RecruiterLogo } from '~/lib/recruiter-public';

/**
 * RecruiterLogoWall — the recruiter-trust signal on the public landing hero
 * (Round 2 §B). A four-column grid of past/prospective recruiter marks, each
 * column an independent vertical `Marquee` scrolling upward. The Marquee atom
 * duplicates its children internally for a seamless loop, pauses on hover /
 * focus-within, and renders a static strip under `prefers-reduced-motion`.
 *
 * Columns run at slightly different speeds so the wall reads as an organic
 * field of logos rather than four synchronised strips.
 *
 * Each cell is a `RecruiterLogo`: it resolves the `simple-icons` mark for the
 * brand's slug and renders it monochrome (currentColor), falling back to a
 * monochrome wordmark tile for the ~40% of brands `simple-icons` doesn't carry
 * (Microsoft, Adobe, Oracle, Amazon, Mercedes, …). The fallback is first-class,
 * not a degraded state — the wall never breaks on a missing slug.
 *
 * Presentation-only: reads semantic tokens (var(--…)) exclusively.
 */

const COLUMN_COUNT = 4;

/** Per-column loop durations (seconds). Staggered so columns desync. */
const COLUMN_DURATIONS = [42, 52, 47, 57] as const;

/**
 * simple-icons exposes each mark as a named `si<PascalCase>` export. The slug
 * is already lowercase with no punctuation, so the export name is `si` + the
 * slug with its first letter uppercased (e.g. `figma` → `siFigma`). The module
 * namespace isn't string-indexable on its own, so we read it through a typed
 * record; `noUncheckedIndexedAccess` makes every miss `undefined` → fallback.
 */
// SAFE-CAST: the simple-icons namespace types each `si*` as a non-optional
// SimpleIcon and isn't string-indexable. We read it by a computed slug-derived
// name, so we re-view it as a partial record; every miss resolves to undefined
// (also enforced by noUncheckedIndexedAccess) and falls back to a wordmark.
const ICON_BY_NAME = simpleIcons as unknown as Record<string, SimpleIcon | undefined>;

function resolveIcon(slug: string): SimpleIcon | undefined {
  if (slug.length === 0) return undefined;
  const exportName = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  return ICON_BY_NAME[exportName];
}

const CELL_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 'var(--space-16)',
  paddingInline: 'var(--space-3)',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--radius-2)',
  border: '1px solid var(--border-default)',
  // Monochrome posture: marks render in a muted ink, lifting toward strong text
  // when the column is paused under a pointer (handled by the group hover below).
  color: 'var(--text-secondary)',
  overflow: 'hidden',
};

const ICON_SIZE = 'var(--space-8)';

function RecruiterLogo({ logo }: { readonly logo: RecruiterLogo }) {
  const icon = resolveIcon(logo.slug);

  if (icon !== undefined) {
    return (
      <div style={CELL_STYLE} title={logo.name}>
        <svg
          role="img"
          aria-label={logo.name}
          viewBox="0 0 24 24"
          width={ICON_SIZE}
          height={ICON_SIZE}
          fill="currentColor"
          style={{ display: 'block', flex: '0 0 auto' }}
        >
          <title>{logo.name}</title>
          <path d={icon.path} />
        </svg>
      </div>
    );
  }

  // Wordmark fallback — a monochrome name tile for brands simple-icons omits.
  return (
    <div style={CELL_STYLE} title={logo.name}>
      <span
        style={{
          fontSize: 'var(--fs-14)',
          fontWeight: 'var(--fw-600)',
          letterSpacing: '0.01em',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: 'var(--lh-14)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {logo.name}
      </span>
    </div>
  );
}

/** Round-robin the logos into `COLUMN_COUNT` balanced columns. */
function splitIntoColumns(logos: readonly RecruiterLogo[]): RecruiterLogo[][] {
  const columns: RecruiterLogo[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  logos.forEach((logo, i) => {
    const column = columns[i % COLUMN_COUNT];
    if (column !== undefined) column.push(logo);
  });
  return columns;
}

export function RecruiterLogoWall() {
  const columns = splitIntoColumns(RECRUITER_LOGOS);

  return (
    <div
      aria-label="A selection of organisations that recruit from NID"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMN_COUNT}, 1fr)`,
        gap: 'var(--space-3)',
        // Vignette the top/bottom so logos fade in/out of the scroll rather than
        // hard-clipping at the band edge.
        maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
        height: 'min(560px, 70vh)',
      }}
    >
      {columns.map((column, columnIndex) => (
        <Marquee
          key={columnIndex}
          direction="vertical"
          durationSeconds={COLUMN_DURATIONS[columnIndex] ?? 48}
          pauseOnHover
          gap="var(--space-3)"
          style={{ height: '100%' }}
        >
          {column.map((logo) => (
            <RecruiterLogo key={logo.slug} logo={logo} />
          ))}
        </Marquee>
      ))}
    </div>
  );
}
