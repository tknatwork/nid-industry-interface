'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Overlay — accessible modal/dialog primitive.
 *
 * Backdrop uses `--surface-overlay`; the centred panel sits on `--surface-card`
 * with the NID panel radius and elevated shadow. Enter motion follows the
 * §6.2b modal pattern (scale 0.95 → 1 + fade) via `--motion-modal`, which the
 * token layer zeroes under `prefers-reduced-motion`.
 *
 * Behaviour: focus trap (Tab / Shift+Tab cycle within the panel), Esc-to-close,
 * backdrop-click-to-close, body scroll lock while open, and focus restoration to
 * the previously focused element on close. Rendered into `document.body` via a
 * portal so it escapes any parent stacking/overflow context.
 *
 * Reused by: Apply ticket overlay, Timeline academic-calendar overlay, Login
 * forgot-password, and the post-login Resources overlays.
 *
 * Client component — relies on portals, refs, and document-level listeners.
 */

export interface OverlayProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title?: ReactNode;
  readonly children: ReactNode;
  /** Max width of the panel. Accepts any CSS length. Defaults to `560px`. */
  readonly width?: string;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-4)',
  backgroundColor: 'var(--surface-overlay)',
  // Fade duration mirrors the modal motion token (decelerate on enter).
  animation: 'nid-overlay-backdrop-in var(--motion-modal)',
};

const panelBaseStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxHeight: 'calc(100vh - var(--space-8))',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: 'var(--surface-card)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-4)',
  boxShadow: 'var(--shadow-3)',
  // Scale 0.95 → 1 + fade, per §6.2b. Zeroed under prefers-reduced-motion.
  animation: 'nid-overlay-panel-in var(--motion-modal)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-5) var(--space-6)',
  borderBottom: '1px solid var(--border-default)',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--ff-sans)',
  fontSize: 'var(--fs-20)',
  fontWeight: 'var(--fw-600)',
  lineHeight: 1.25,
  color: 'var(--text-strong)',
};

const closeButtonStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'var(--space-8)',
  height: 'var(--space-8)',
  marginTop: 'calc(var(--space-1) * -1)',
  marginRight: 'calc(var(--space-2) * -1)',
  border: 'none',
  borderRadius: 'var(--radius-2)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 'var(--fs-20)',
  lineHeight: 1,
  cursor: 'pointer',
  transition: 'background-color var(--motion-micro), color var(--motion-micro)',
};

const bodyStyle: CSSProperties = {
  padding: 'var(--space-6)',
  overflowY: 'auto',
  fontFamily: 'var(--ff-sans)',
  fontSize: 'var(--fs-16)',
  color: 'var(--text-primary)',
  lineHeight: 1.5,
};

const keyframes = `
@keyframes nid-overlay-backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes nid-overlay-panel-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
`;

export function Overlay({ open, onClose, title, children, width = '560px' }: OverlayProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;

  // Portals require the DOM; guard SSR by only rendering after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const focusFirstElement = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable ?? panel).focus();
  }, []);

  // On open: remember the trigger, move focus in, lock body scroll.
  // On close/unmount: restore focus and scroll.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Defer focus until the portal content is in the DOM.
    const raf = requestAnimationFrame(focusFirstElement);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, focusFirstElement]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        // Nothing tabbable: keep focus pinned on the panel itself.
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === panel) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const handleBackdropMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      // Close only on a genuine backdrop press, not a drag that started inside
      // the panel and released on the backdrop (text selection, etc.).
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!mounted || !open) return null;

  return createPortal(
    <div
      style={backdropStyle}
      onMouseDown={handleBackdropMouseDown}
      onKeyDown={handleKeyDown}
    >
      <style>{keyframes}</style>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        {...(title != null ? { 'aria-labelledby': titleId } : {})}
        tabIndex={-1}
        style={{ ...panelBaseStyle, maxWidth: width, outline: 'none' }}
      >
        {title != null && (
          <header style={headerStyle}>
            <h2 id={titleId} style={titleStyle}>
              {title}
            </h2>
            <button type="button" aria-label="Close dialog" onClick={onClose} style={closeButtonStyle}>
              {'✕'}
            </button>
          </header>
        )}
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
