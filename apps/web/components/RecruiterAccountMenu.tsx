'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { logoutAction } from '~/app/recruiter/account-actions';

/**
 * Compact recruiter account control for the shell header (plan §L). Shows the
 * acting company name as a disclosure button; the panel offers "Profile &
 * settings" and a "Log out" item. Logout posts to the {@link logoutAction}
 * server action via a tiny form so it works without client JS.
 *
 * Accessibility: the trigger is a real <button> with aria-haspopup/aria-expanded
 * driving a conditionally rendered panel. Escape closes it, and an outside click
 * or blur leaving the group dismisses it. No external deps.
 */
export function RecruiterAccountMenu({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickAway);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickAway);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${companyName}`}
        style={triggerStyle}
      >
        <span aria-hidden style={avatarStyle}>
          {initials(companyName)}
        </span>
        <span style={triggerLabelStyle}>{companyName}</span>
        <span aria-hidden style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div role="menu" aria-label="Account" style={panelStyle}>
          <a href="/recruiter/profile" role="menuitem" style={itemStyle} onClick={() => setOpen(false)}>
            Profile &amp; settings
          </a>
          <div style={dividerStyle} />
          <form action={logoutAction} style={{ margin: 0 }}>
            <button type="submit" role="menuitem" style={{ ...itemStyle, ...logoutItemStyle }}>
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/** Two-letter initials from the company name for the avatar chip. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '·';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

// ── Styles (tokens only, consistent with RecruiterShell header) ──────────────

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  paddingBlock: 'var(--space-1)',
  paddingInline: 'var(--space-2)',
  borderRadius: 'var(--radius-2)',
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  color: 'var(--text-strong)',
  cursor: 'pointer',
  font: 'inherit',
  maxWidth: '15rem',
};

const avatarStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.5rem',
  height: '1.5rem',
  flexShrink: 0,
  borderRadius: 'var(--radius-1)',
  background: 'var(--accent)',
  color: 'var(--text-on-accent)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  letterSpacing: '0.02em',
};

const triggerLabelStyle: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-strong)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const panelStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + var(--space-2))',
  right: 0,
  zIndex: 20,
  minWidth: '12rem',
  display: 'flex',
  flexDirection: 'column',
  padding: 'var(--space-1)',
  borderRadius: 'var(--radius-2)',
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)',
  boxShadow: 'var(--shadow-2)',
};

const itemStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  paddingBlock: 'var(--space-2)',
  paddingInline: 'var(--space-3)',
  borderRadius: 'var(--radius-1)',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  textDecoration: 'none',
  cursor: 'pointer',
  font: 'inherit',
};

const logoutItemStyle: CSSProperties = {
  color: 'var(--accent)',
};

const dividerStyle: CSSProperties = {
  height: '1px',
  margin: 'var(--space-1) 0',
  background: 'var(--border-default)',
};
