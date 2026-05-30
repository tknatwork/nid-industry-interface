'use client';

import {
  useCallback,
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

/**
 * StarRating — an accessible 1..max star rating control.
 *
 * Round 4 uses it twice: the recruiter's "rate this candidate's interview"
 * review on the After-tally letter dialog, and the dashboard experience widget
 * ("rate the placement portal"). Both want the same keyboard-driven, token-only
 * widget, so it lives here as a shared atom that holds no domain knowledge.
 *
 * Interaction model follows the WAI-ARIA radio-group pattern: the row is a
 * `role="radiogroup"`; each star is a `role="radio"` whose `aria-checked`
 * reflects the current value. Exactly one star is in the tab order (the selected
 * one, or the first when nothing is selected); Arrow keys move the selection,
 * Home/End jump to the ends, and Space/Enter commit the focused star. This keeps
 * the whole control reachable with a single Tab stop.
 *
 * `readOnly` renders the same stars for display (e.g. showing a recruiter's
 * prior rating) without any radio semantics or focus handling. `disabled` keeps
 * the radio semantics but blocks changes and dims the control.
 *
 * When `name` is provided a hidden `<input>` carries the numeric value so the
 * control can be dropped straight into a server-action `<form>` with no client
 * state plumbing. Controlled and uncontrolled use are both supported: pass
 * `value` to control it, or rely on the internal state and read it back via the
 * hidden input on submit.
 *
 * Reads only semantic design tokens (`var(--...)`), mirroring the other atoms.
 */

export interface StarRatingProps {
  /** Current rating (controlled). When omitted, the component is uncontrolled
   *  and seeds its internal state from `defaultValue`. */
  readonly value?: number;
  /** Initial rating for uncontrolled use. Defaults to 0 (nothing selected). */
  readonly defaultValue?: number;
  /** Number of stars. Defaults to 5. */
  readonly max?: number;
  /** Called with the new rating whenever the user picks a star. */
  readonly onChange?: (value: number) => void;
  /** Pixel size of each star glyph. Defaults to 24. */
  readonly size?: number;
  /** Accessible label for the group (e.g. "Interview rating"). */
  readonly label: string;
  /** Render-only: show stars without interaction or radio semantics. */
  readonly readOnly?: boolean;
  /** Keep radio semantics but block changes and dim the control. */
  readonly disabled?: boolean;
  /** When set, emit a hidden `<input name>` carrying the numeric value for
   *  plain HTML form posts. */
  readonly name?: string;
}

const groupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
};

export function StarRating({
  value,
  defaultValue = 0,
  max = 5,
  onChange,
  size = 24,
  label,
  readOnly = false,
  disabled = false,
  name,
}: StarRatingProps) {
  const groupId = useId();
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = isControlled ? value : internal;

  // The currently focusable star: the selected one, or the first when none is
  // selected. Drives the roving tabindex across the radio group.
  const [focusIndex, setFocusIndex] = useState(0);

  const commit = useCallback(
    (next: number) => {
      if (readOnly || disabled) return;
      const clamped = Math.max(0, Math.min(max, next));
      if (!isControlled) setInternal(clamped);
      onChange?.(clamped);
    },
    [readOnly, disabled, max, isControlled, onChange],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLSpanElement>, starValue: number) => {
      if (readOnly || disabled) return;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp': {
          event.preventDefault();
          const next = Math.min(max, starValue + 1);
          setFocusIndex(next - 1);
          commit(next);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowDown': {
          event.preventDefault();
          const next = Math.max(1, starValue - 1);
          setFocusIndex(next - 1);
          commit(next);
          break;
        }
        case 'Home': {
          event.preventDefault();
          setFocusIndex(0);
          commit(1);
          break;
        }
        case 'End': {
          event.preventDefault();
          setFocusIndex(max - 1);
          commit(max);
          break;
        }
        case ' ':
        case 'Enter': {
          event.preventDefault();
          commit(starValue);
          break;
        }
        default:
          break;
      }
    },
    [readOnly, disabled, max, commit],
  );

  const stars = Array.from({ length: max }, (_, i) => i + 1);
  // Roving tabindex anchor: prefer the selected star, else the tracked focus.
  const tabbableValue = current >= 1 ? current : focusIndex + 1;

  return (
    <span
      role={readOnly ? undefined : 'radiogroup'}
      aria-label={readOnly ? `${label}: ${current} of ${max}` : label}
      aria-disabled={disabled || undefined}
      style={groupStyle}
    >
      {stars.map((starValue) => {
        const filled = starValue <= current;
        const isTabbable = !readOnly && !disabled && starValue === tabbableValue;
        const interactive = !readOnly && !disabled;
        return (
          <span
            key={starValue}
            id={`${groupId}-${starValue}`}
            role={readOnly ? undefined : 'radio'}
            aria-checked={readOnly ? undefined : filled}
            aria-label={readOnly ? undefined : `${starValue} star${starValue === 1 ? '' : 's'}`}
            tabIndex={interactive ? (isTabbable ? 0 : -1) : undefined}
            onClick={interactive ? () => commit(starValue) : undefined}
            onFocus={interactive ? () => setFocusIndex(starValue - 1) : undefined}
            onKeyDown={
              interactive
                ? (event: ReactKeyboardEvent<HTMLSpanElement>) => handleKeyDown(event, starValue)
                : undefined
            }
            style={{
              display: 'inline-flex',
              color: filled ? 'var(--accent)' : 'var(--border-emphasized)',
              cursor: interactive ? 'pointer' : 'default',
              borderRadius: 'var(--radius-1)',
              transition: 'color var(--motion-micro)',
            }}
          >
            <StarGlyph size={size} filled={filled} />
          </span>
        );
      })}
      {name !== undefined && <input type="hidden" name={name} value={current} />}
    </span>
  );
}

function StarGlyph({ size, filled }: { readonly size: number; readonly filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
