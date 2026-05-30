'use client';

import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';

/**
 * Marquee — auto-scrolling strip that loops its content seamlessly in either
 * axis. Two consumers in the Round 2 redesign:
 *   - vertical: the homepage `RecruiterLogoWall` (a column of logos scrolling up)
 *   - horizontal: the `RecruiterShell` rolling banner (time-bound activity line)
 *
 * Mechanics:
 *   - The children are rendered twice back-to-back; the track translates by
 *     exactly -50% so the second copy lands where the first began — a seamless
 *     loop with no visible seam or jump.
 *   - Pause-on-hover is opt-in (default on) and is also paused on keyboard
 *     focus-within, so a focused link inside the strip stops moving.
 *   - `prefers-reduced-motion: reduce` renders a static strip (no animation).
 *     This is enforced two ways: the keyframes are wrapped in a non-reduced
 *     media query (so motion never starts under reduce), and the global token
 *     layer already neutralises animation durations. Reading order is preserved
 *     because the duplicated copy is `aria-hidden`.
 *
 * Reads only semantic tokens (var(--…)); no primitives leak in here.
 */

export type MarqueeDirection = 'vertical' | 'horizontal';

export interface MarqueeProps {
  readonly children: ReactNode;
  /** Scroll axis. `vertical` scrolls upward, `horizontal` scrolls leftward. */
  readonly direction?: MarqueeDirection;
  /** Seconds for one full loop of a single content copy. Higher = slower. */
  readonly durationSeconds?: number;
  /** Pause the scroll while the pointer is over the strip. Default: true. */
  readonly pauseOnHover?: boolean;
  /** Gap between the two duplicated content copies. Defaults to a token space. */
  readonly gap?: string;
  /** Accessible label for the scrolling region. */
  readonly label?: string;
  /** Extra styles merged onto the outer viewport element. */
  readonly style?: CSSProperties;
  readonly className?: string;
}

const VIEWPORT_BASE: CSSProperties = {
  overflow: 'hidden',
  position: 'relative',
};

export function Marquee({
  children,
  direction = 'horizontal',
  durationSeconds = 30,
  pauseOnHover = true,
  gap = 'var(--space-6)',
  label,
  style,
  className,
}: MarqueeProps) {
  const rawId = useId();
  // useId yields characters illegal in a CSS identifier (":"); sanitise it.
  const animName = useMemo(() => `nid-marquee-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);

  const isVertical = direction === 'vertical';

  const trackStyle: CSSProperties = {
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    gap,
    width: isVertical ? '100%' : 'max-content',
    animationName: animName,
    animationDuration: `${durationSeconds}s`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    willChange: 'transform',
  };

  const copyStyle: CSSProperties = {
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    gap,
    flex: '0 0 auto',
    ...(isVertical ? {} : { minWidth: 'max-content' }),
  };

  // Translate exactly one copy + the gap that separates the two copies, so copy
  // #2 arrives precisely where copy #1 started — no seam.
  const shift = isVertical ? `translateY(calc(-50% - (${gap} / 2)))` : `translateX(calc(-50% - (${gap} / 2)))`;

  const keyframes = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes ${animName} {
    from { transform: translate3d(0, 0, 0); }
    to { transform: ${shift}; }
  }
  [data-marquee-track="${animName}"]:hover {
    animation-play-state: ${pauseOnHover ? 'paused' : 'running'};
  }
  [data-marquee-track="${animName}"]:focus-within {
    animation-play-state: paused;
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-marquee-track="${animName}"] {
    animation: none;
    transform: none;
  }
}
`;

  return (
    <div
      {...(className !== undefined ? { className } : {})}
      {...(label !== undefined ? { 'aria-label': label, role: 'marquee' } : {})}
      style={{ ...VIEWPORT_BASE, ...style }}
    >
      <style>{keyframes}</style>
      <div data-marquee-track={animName} style={trackStyle}>
        <div style={copyStyle}>{children}</div>
        <div style={copyStyle} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
