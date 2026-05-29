/**
 * Industry Interface logo — a vector recreation of the live II wordmark: a
 * geometric "I I" monogram (bar + square / circle + bar) beside the two-line
 * "INDUSTRY / INTERFACE" wordmark in the brand font (Open Sans, heavy uppercase).
 *
 * The mark uses `currentColor`, so it renders black on light chrome and white on
 * the dark admin chrome automatically — no separate asset, crisp at any size.
 */

export interface LogoProps {
  /** Mark height in px (the wordmark scales from it). Default 30. */
  readonly height?: number;
  /** Show the "INDUSTRY INTERFACE" wordmark beside the mark. Default true. */
  readonly wordmark?: boolean;
  /** Accessible name for the whole lockup. */
  readonly title?: string;
}

export function Logo({ height = 30, wordmark = true, title = 'Industry Interface' }: LogoProps) {
  const markW = Math.round((height * 44) / 40);
  const wordSize = Math.round(height * 0.4);
  return (
    <span
      role="img"
      aria-label={title}
      style={{ display: 'inline-flex', alignItems: 'center', gap: `${Math.round(height * 0.3)}px`, color: 'inherit', lineHeight: 1 }}
    >
      <svg viewBox="0 0 44 40" height={height} width={markW} aria-hidden="true" focusable="false" style={{ display: 'block', flexShrink: 0 }}>
        {/* left glyph: tall bar + dot */}
        <rect x="2" y="0" width="10" height="23" fill="currentColor" />
        <circle cx="7" cy="34" r="6" fill="currentColor" />
        {/* right glyph: square + tall bar */}
        <rect x="22" y="0" width="12" height="12" fill="currentColor" />
        <rect x="24" y="16" width="10" height="24" fill="currentColor" />
      </svg>
      {wordmark && (
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--ff-sans)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            fontSize: `${wordSize}px`,
            lineHeight: 0.98,
            color: 'currentColor',
            whiteSpace: 'nowrap',
          }}
        >
          Industry
          <br />
          Interface
        </span>
      )}
    </span>
  );
}
