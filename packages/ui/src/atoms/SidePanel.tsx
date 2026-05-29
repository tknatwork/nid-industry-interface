import type { ReactNode } from 'react';

/**
 * SidePanel — a left filter rail. Sections of filter buttons, each with an
 * optional count and an active state. Used by the JD list to segment by
 * type (Full-time vs Internship) and status (Drafts / In moderation /
 * Published / Closed), but generic enough for any faceted list surface.
 *
 * Presentational only: this atom owns no selection state. A consumer either
 * passes `href` (renders an `<a>` — the active item is decided by the caller
 * from the current route) or passes `onSelect` (renders a `<button>` for
 * controlled, client-side filtering). It reads only semantic tokens.
 */

export interface SidePanelOption {
  /** Stable identity for the option (also used as the React key). */
  readonly id: string;
  /** Visible label. */
  readonly label: ReactNode;
  /** Optional count badge (e.g. number of JDs in this facet). */
  readonly count?: number;
  /** Whether this option is the currently-applied filter. */
  readonly active?: boolean;
  /** Render as a link to this href (mutually exclusive with `onSelect`). */
  readonly href?: string;
  /** Disable the option (e.g. an empty facet). */
  readonly disabled?: boolean;
}

export interface SidePanelSection {
  /** Stable identity for the section (also used as the React key). */
  readonly id: string;
  /** Section heading shown above its options. */
  readonly label: ReactNode;
  readonly options: ReadonlyArray<SidePanelOption>;
}

export interface SidePanelProps {
  readonly sections: ReadonlyArray<SidePanelSection>;
  /** Accessible label for the nav landmark (e.g. "Filter JDs"). */
  readonly ariaLabel?: string;
  /**
   * Controlled-selection handler. When provided, options without an `href`
   * render as buttons and call this with the option id. Ignored for options
   * that declare an `href` (those navigate as links).
   */
  readonly onSelect?: (optionId: string) => void;
  /** Optional content rendered above the first section (e.g. a "Clear" link). */
  readonly header?: ReactNode;
}

const railStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 'var(--space-6)',
  padding: 'var(--space-5)',
  backgroundColor: 'var(--surface-panel)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-panel)',
};

const sectionLabelStyle = {
  margin: 0,
  marginBottom: 'var(--space-3)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
};

const optionListStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 'var(--space-1)',
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function optionStyle(active: boolean, disabled: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
    width: '100%',
    textAlign: 'left' as const,
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-2)',
    border: '1px solid transparent',
    backgroundColor: active ? 'var(--surface-card)' : 'transparent',
    borderColor: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontFamily: 'var(--ff-sans)',
    fontSize: 'var(--fs-14)',
    fontWeight: active ? 'var(--fw-600)' : 'var(--fw-500)',
    lineHeight: 1.3,
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition:
      'background-color var(--motion-micro), color var(--motion-micro), border-color var(--motion-micro)',
  };
}

function countStyle(active: boolean) {
  return {
    flexShrink: 0,
    minWidth: '1.5em',
    textAlign: 'center' as const,
    padding: '0 var(--space-2)',
    borderRadius: 'var(--radius-full)',
    backgroundColor: active ? 'var(--accent)' : 'var(--surface-elevated)',
    color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
    fontSize: 'var(--fs-12)',
    fontWeight: 'var(--fw-600)',
    fontVariantNumeric: 'tabular-nums' as const,
    lineHeight: 1.6,
  };
}

function OptionInner({ option }: { readonly option: SidePanelOption }) {
  return (
    <>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {option.label}
      </span>
      {option.count !== undefined && (
        <span style={countStyle(Boolean(option.active))}>{option.count}</span>
      )}
    </>
  );
}

function SidePanelOptionItem({
  option,
  onSelect,
}: {
  readonly option: SidePanelOption;
  readonly onSelect?: (optionId: string) => void;
}) {
  const active = Boolean(option.active);
  const disabled = Boolean(option.disabled);
  const style = optionStyle(active, disabled);

  if (option.href !== undefined && !disabled) {
    return (
      <li>
        <a href={option.href} aria-current={active ? 'true' : undefined} style={style}>
          <OptionInner option={option} />
        </a>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={active}
        onClick={onSelect ? () => onSelect(option.id) : undefined}
        style={style}
      >
        <OptionInner option={option} />
      </button>
    </li>
  );
}

export function SidePanel({ sections, ariaLabel = 'Filters', onSelect, header }: SidePanelProps) {
  return (
    <nav aria-label={ariaLabel} style={railStyle}>
      {header}
      {sections.map((section) => (
        <div key={section.id}>
          <h3 style={sectionLabelStyle}>{section.label}</h3>
          <ul style={optionListStyle}>
            {section.options.map((option) => (
              <SidePanelOptionItem key={option.id} option={option} {...(onSelect ? { onSelect } : {})} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
