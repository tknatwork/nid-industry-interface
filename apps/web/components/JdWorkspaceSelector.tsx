'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

/**
 * One JD option for the workspace picker. Plain serializable data only — the
 * page (a Server Component) maps its `JdRecord[]` down to this shape so this
 * client component never imports a store or the full record type.
 */
export interface JdWorkspaceOption {
  readonly id: string;
  readonly title: string;
  readonly location?: string;
}

export interface JdWorkspaceSelectorProps {
  readonly jds: readonly JdWorkspaceOption[];
  readonly selectedJdId?: string;
  /** Workspace base path, e.g. `/recruiter/interviews`. The picker pushes `${basePath}?jd=<id>`. */
  readonly basePath: string;
  readonly label?: string;
}

/**
 * Workspace JD picker (plan Round 4 §A — the linear-IA spine).
 *
 * A client-only `<select>` that swaps the `?jd=` query param via the router, so
 * the workspace re-renders for the chosen JD WITHOUT a navigation that would
 * change the active top-tab. This is the mechanism that keeps Candidates /
 * Interview / Offers self-contained: you pick a JD here and stay on the tab,
 * rather than navigating into `/recruiter/jds/[jdId]/…` (which flipped the tab).
 *
 * Receives plain serializable props only — never a store, never a `JdRecord`.
 */
export function JdWorkspaceSelector({
  jds,
  selectedJdId,
  basePath,
  label = 'Job description',
}: JdWorkspaceSelectorProps) {
  const router = useRouter();
  return (
    <div style={wrapStyle}>
      <label style={labelStyle} htmlFor="jd-workspace-select">
        {label}
      </label>
      <select
        id="jd-workspace-select"
        value={selectedJdId ?? ''}
        onChange={(e) => {
          const id = e.target.value;
          router.push(id ? `${basePath}?jd=${encodeURIComponent(id)}` : basePath);
        }}
        style={selectStyle}
      >
        <option value="">Choose a JD…</option>
        {jds.map((jd) => (
          <option key={jd.id} value={jd.id}>
            {jd.title}
            {jd.location ? ` · ${jd.location}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  maxWidth: '520px',
};

const labelStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const selectStyle: CSSProperties = {
  appearance: 'none',
  width: '100%',
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--fs-16)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--border-emphasized)',
  borderRadius: 'var(--radius-2)',
  cursor: 'pointer',
};
