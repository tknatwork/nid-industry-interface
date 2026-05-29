'use client';

import { useState } from 'react';

/**
 * Demo playground (showcase). The RECRUITER portal is live + interactive and
 * takes maximum space; the INSTITUTION (admin) and STUDENT sides are written
 * referenced examples stacked vertically in a narrow column, plus a written
 * demo script. Chrome uses the NID design tokens (navy --accent + the discipline
 * palette) to match the portal's colour coding. The recruiter pane is a
 * same-origin iframe over the live mock-store backend, so Server-Action forms
 * work and state is real.
 */

const RECRUITER_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['Offers — wave cascade', '/recruiter/jds/jd_00001/offers'],
  ['Dashboard', '/recruiter/dashboard'],
  ['Job descriptions', '/recruiter/jds'],
  ['Post a JD (wizard + stipend gate)', '/recruiter/jds/new'],
  ['Applicants (portfolio-first)', '/recruiter/jds/jd_00001/applicants'],
  ['Interview console', '/recruiter/jds/jd_00001/interviews'],
  ['Your stats + health band', '/recruiter/stats'],
  ['Stipend calculator', '/recruiter/calculator'],
];

export default function PlaygroundPage() {
  const [src, setSrc] = useState(RECRUITER_ROUTES[0]![1]);
  const [nonce, setNonce] = useState(0);
  const reload = () => setNonce((n) => n + 1);
  const navigate = (to: string) => {
    setSrc(to);
    setNonce((n) => n + 1);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-page)', overflow: 'hidden' }}>
      {/* Top chrome — institutional dark bar with the navy accent underline (matches AdminShell) */}
      <header style={topBar}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', flexWrap: 'wrap', minWidth: 0 }}>
          <strong style={{ fontSize: 'var(--fs-14)', letterSpacing: '0.04em' }}>NID Industry Interface</strong>
          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--grey-300)' }}>
            Recruiter demo (live) · institution &amp; student shown as reference
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--grey-300)', whiteSpace: 'nowrap' }}>Recruiter view</span>
          <select value={src} onChange={(e) => navigate(e.target.value)} style={routeSelect} aria-label="Recruiter page">
            {RECRUITER_ROUTES.map(([label, href]) => (
              <option key={href} value={href}>{label}</option>
            ))}
          </select>
          <button onClick={reload} style={chromeBtn} title="Reload recruiter view">↻</button>
          <a href={src} target="_blank" rel="noreferrer" style={chromeBtn} title="Open recruiter view in a new tab">↗</a>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Recruiter — LIVE, maximum space */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-emphasized)' }}>
          <iframe
            key={nonce}
            src={src}
            title="Recruiter portal (live)"
            style={{ flex: 1, width: '100%', border: 'none', background: 'var(--surface-card)' }}
          />
        </main>

        {/* Institution + Student — written reference, stacked vertically */}
        <aside style={refColumn}>
          <ReferenceCard
            accent="var(--purple-500)"
            label="Institution · Placement admin"
            live="/admin/health-scores"
            lines={[
              'Moderates every JD. The recruiter’s "Product Designer (frontend-heavy)" JD is flagged by the ML analyzer ×1.6 — adjusted floor ₹9.6L > the offered ₹8L → held for re-scope.',
              'Health scores: Acme = Excellent (80), Bauhaus = Good, Pixel Forge = Watch (42), GhostCorp = Blacklisted.',
              'Deciding the Pixel Forge stipend-not-paid redressal as "upheld" drops its score 42 → 27 (Watch → Restricted) — live, on the same backend.',
              'Blacklist, payment-cell, offer-adjustments, and API-key revocation all live here. Revoking GhostCorp’s key makes the federation API return 401.',
            ]}
          />
          <ReferenceCard
            accent="var(--cyan-500)"
            label="Student"
            live="/student/offers"
            lines={[
              'Aanya Roy opts into Spring 2026 → the published Product Designer JD appears in her eligible feed.',
              'Her offer inbox holds a pending ₹12L Wave-1 offer. She accepts → the recruiter’s Offers board moves to filled 1/2 (reload the recruiter pane to watch it).',
              'Application tracker stitches shortlist → interview slot → offer. "Report a company" files straight into the admin redressal queue.',
            ]}
          />
          <section style={{ ...refCard, borderLeftColor: 'var(--navy-500)' }}>
            <p style={refTitle}>Demo script</p>
            <ol style={{ margin: 0, paddingLeft: 'var(--space-5)', display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <li>Recruiter pane → <strong>Offers</strong>: Wave 1, one pending offer to Aanya (₹12L).</li>
              <li>Open the <strong>Student</strong> reference&rsquo;s ↗, accept the offer, return and <strong>↻</strong> the recruiter pane → <strong>filled 1/2</strong>.</li>
              <li>Recruiter → <strong>Post a JD</strong>: the wizard&rsquo;s stipend gate blocks below-floor pay.</li>
              <li>Show the <strong>Admin</strong> reference&rsquo;s ↗ → moderation flags the ×1.6 scope-creep JD; deciding a redressal moves a health band.</li>
              <li>Recruiter → <strong>Your stats</strong>: the company&rsquo;s health band + conduct signals it carries into the next cycle.</li>
            </ol>
            <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-default)' }}>
              All panes share one live backend. Full script in <code>DEMO.md</code>.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ReferenceCard({ accent, label, live, lines }: { accent: string; label: string; live: string; lines: readonly string[] }) {
  return (
    <section style={{ ...refCard, borderLeftColor: accent }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
        <p style={{ ...refTitle, color: accent }}>{label}</p>
        <a href={live} target="_blank" rel="noreferrer" style={refLiveLink}>open live ↗</a>
      </div>
      <ul style={{ margin: 'var(--space-2) 0 0', paddingLeft: 'var(--space-5)', display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </section>
  );
}

const topBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)',
  padding: 'var(--space-2) var(--space-4)', background: 'var(--grey-900)', color: 'var(--grey-0)',
  borderBottom: '3px solid var(--accent)', flexWrap: 'wrap',
};
const refColumn: React.CSSProperties = {
  width: '360px', flexShrink: 0, overflowY: 'auto', background: 'var(--surface-panel)',
  padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-3)', alignContent: 'start',
};
const refCard: React.CSSProperties = {
  background: 'var(--surface-card)', border: '1px solid var(--card-border)', borderLeft: '3px solid var(--accent)',
  borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)',
};
const refTitle: React.CSSProperties = {
  fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-strong)',
};
const refLiveLink: React.CSSProperties = {
  fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textDecoration: 'none', whiteSpace: 'nowrap',
};
const routeSelect: React.CSSProperties = {
  fontSize: 'var(--fs-12)', padding: '3px 8px', borderRadius: 'var(--radius-1)', maxWidth: '260px',
  border: '1px solid var(--grey-500)', background: 'var(--grey-900)', color: 'var(--grey-0)',
};
const chromeBtn: React.CSSProperties = {
  fontSize: 'var(--fs-14)', lineHeight: 1, padding: '3px 9px', borderRadius: 'var(--radius-1)',
  border: '1px solid var(--grey-500)', background: 'var(--grey-900)', color: 'var(--grey-0)', cursor: 'pointer', textDecoration: 'none',
};
