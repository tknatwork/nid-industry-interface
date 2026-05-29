'use client';

import { useState } from 'react';

/**
 * A monospace value (URL, token, curl snippet) with a Copy button + optional
 * open-link. Used on the recruiter integrations page so everything is one click
 * to paste into their own system.
 */
export function CopyField({
  value,
  href,
  multiline = false,
}: {
  value: string;
  href?: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — value is still visible to select manually */
    }
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: multiline ? 'flex-start' : 'center',
        gap: 'var(--space-2)',
        background: 'var(--grey-900)',
        borderRadius: 'var(--radius-2)',
        padding: 'var(--space-2) var(--space-3)',
      }}
    >
      <code
        style={{
          flex: 1,
          minWidth: 0,
          color: 'var(--grey-0)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 'var(--fs-12)',
          lineHeight: 1.6,
          whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
          overflowX: multiline ? 'visible' : 'auto',
          wordBreak: multiline ? 'break-word' : 'normal',
        }}
      >
        {value}
      </code>
      {href && (
        <a href={href} target="_blank" rel="noreferrer" style={btn} title="Open">
          ↗
        </a>
      )}
      <button onClick={copy} style={btn}>
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

const btn: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  padding: '4px 10px',
  borderRadius: 'var(--radius-1)',
  border: '1px solid var(--grey-700)',
  background: 'var(--grey-700)',
  color: 'var(--grey-0)',
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};
