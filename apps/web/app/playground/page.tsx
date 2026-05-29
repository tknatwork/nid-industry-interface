'use client';

import { useState } from 'react';

/**
 * 3-up demo playground (Phase: showcase). All three portals on one display —
 * recruiter on top, institution (admin) + student side-by-side below — each in a
 * same-origin iframe against the one live mock-store backend. Act in one pane,
 * hit ↻ on another to watch the cross-portal effect (e.g. accept an offer as the
 * student → refresh the recruiter pane → the wave cascade moves to filled 1/2).
 *
 * Client component: iframe src + per-pane reload (via a remount key) are local UI
 * state. No server state of its own.
 */

type PortalKey = 'recruiter' | 'admin' | 'student';

const ROUTES: Record<PortalKey, ReadonlyArray<readonly [string, string]>> = {
  recruiter: [
    ['Offers — wave cascade', '/recruiter/jds/jd_00001/offers'],
    ['Dashboard', '/recruiter/dashboard'],
    ['Job descriptions', '/recruiter/jds'],
    ['Applicants (portfolio-first)', '/recruiter/jds/jd_00001/applicants'],
    ['Interview console', '/recruiter/jds/jd_00001/interviews'],
    ['Your stats + health band', '/recruiter/stats'],
    ['Stipend calculator', '/recruiter/calculator'],
  ],
  admin: [
    ['Health scores', '/admin/health-scores'],
    ['Recruiter queue', '/admin/recruiters/queue'],
    ['JD moderation', '/admin/jds'],
    ['Scope-creep JD (×1.6)', '/admin/jds/jd_00004'],
    ['Student redressal', '/admin/redressal'],
    ['Blacklist', '/admin/blacklist'],
    ['Payment cell', '/admin/payment-cell'],
  ],
  student: [
    ['Offer inbox', '/student/offers'],
    ['Dashboard', '/student'],
    ['Eligible openings', '/student/jds'],
    ['Applications tracker', '/student/applications'],
    ['Cycle opt-in', '/student/cycles'],
    ['Report a company', '/student/report-company'],
  ],
};

const META: Record<PortalKey, { label: string; accent: string }> = {
  recruiter: { label: 'Recruiter', accent: 'var(--navy-500)' },
  admin: { label: 'Institution · Placement admin', accent: 'var(--purple-500)' },
  student: { label: 'Student', accent: 'var(--cyan-500)' },
};

export default function PlaygroundPage() {
  const [src, setSrc] = useState<Record<PortalKey, string>>({
    recruiter: ROUTES.recruiter[0]![1],
    admin: ROUTES.admin[0]![1],
    student: ROUTES.student[0]![1],
  });
  const [nonce, setNonce] = useState<Record<PortalKey, number>>({ recruiter: 0, admin: 0, student: 0 });

  const reload = (k: PortalKey) => setNonce((n) => ({ ...n, [k]: n[k] + 1 }));
  const reloadAll = () => setNonce((n) => ({ recruiter: n.recruiter + 1, admin: n.admin + 1, student: n.student + 1 }));
  const navigate = (k: PortalKey, to: string) => {
    setSrc((s) => ({ ...s, [k]: to }));
    setNonce((n) => ({ ...n, [k]: n[k] + 1 }));
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--grey-900)', color: 'var(--grey-0)', overflow: 'hidden' }}>
      <header style={bar}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 'var(--fs-14)', letterSpacing: '0.04em' }}>NID Industry Interface</strong>
          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--grey-300)' }}>
            3-up playground · all panes share one live backend — act in one, ↻ another to see the effect
          </span>
        </div>
        <button onClick={reloadAll} style={btn}>↻ Refresh all</button>
      </header>

      {/* Recruiter on top (full width) */}
      <Pane k="recruiter" src={src.recruiter} nonce={nonce.recruiter} onNavigate={navigate} onReload={reload} flex={4.2} />

      {/* Institution + Student side-by-side below */}
      <div style={{ flex: 5.8, display: 'flex', minHeight: 0, borderTop: '1px solid var(--grey-700)' }}>
        <div style={{ flex: 1, display: 'flex', minWidth: 0, borderRight: '1px solid var(--grey-700)' }}>
          <Pane k="admin" src={src.admin} nonce={nonce.admin} onNavigate={navigate} onReload={reload} flex={1} fill />
        </div>
        <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
          <Pane k="student" src={src.student} nonce={nonce.student} onNavigate={navigate} onReload={reload} flex={1} fill />
        </div>
      </div>
    </div>
  );
}

function Pane({
  k,
  src,
  nonce,
  onNavigate,
  onReload,
  flex,
  fill,
}: {
  k: PortalKey;
  src: string;
  nonce: number;
  onNavigate: (k: PortalKey, to: string) => void;
  onReload: (k: PortalKey) => void;
  flex: number;
  fill?: boolean;
}) {
  const meta = META[k];
  return (
    <section style={{ flex, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, width: fill ? '100%' : undefined }}>
      <div style={{ ...paneBar, borderLeft: `3px solid ${meta.accent}` }}>
        <span style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          {meta.label}
        </span>
        <select
          value={src}
          onChange={(e) => onNavigate(k, e.target.value)}
          style={select}
          aria-label={`${meta.label} page`}
        >
          {ROUTES[k].map(([label, href]) => (
            <option key={href} value={href}>{label}</option>
          ))}
        </select>
        <button onClick={() => onReload(k)} style={miniBtn} title="Reload this pane">↻</button>
        <a href={src} target="_blank" rel="noreferrer" style={miniBtn} title="Open in new tab">↗</a>
      </div>
      <iframe
        key={`${k}-${nonce}`}
        src={src}
        title={meta.label}
        style={{ flex: 1, width: '100%', border: 'none', background: 'var(--grey-0)' }}
      />
    </section>
  );
}

const bar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)',
  padding: 'var(--space-2) var(--space-4)', background: 'var(--grey-900)', borderBottom: '1px solid var(--grey-700)', flexWrap: 'wrap',
};
const paneBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
  padding: 'var(--space-1) var(--space-3)', background: 'var(--grey-700)', color: 'var(--grey-0)',
};
const select: React.CSSProperties = {
  flex: 1, minWidth: 0, fontSize: 'var(--fs-12)', padding: '2px 6px', borderRadius: 'var(--radius-1)',
  border: '1px solid var(--grey-500)', background: 'var(--grey-900)', color: 'var(--grey-0)',
};
const btn: React.CSSProperties = {
  fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--grey-500)', background: 'var(--grey-0)', color: 'var(--grey-900)', cursor: 'pointer', whiteSpace: 'nowrap',
};
const miniBtn: React.CSSProperties = {
  fontSize: 'var(--fs-14)', lineHeight: 1, padding: '2px 8px', borderRadius: 'var(--radius-1)',
  border: '1px solid var(--grey-500)', background: 'var(--grey-900)', color: 'var(--grey-0)', cursor: 'pointer', textDecoration: 'none',
};
