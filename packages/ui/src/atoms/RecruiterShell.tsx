import type { ReactNode } from 'react';
import { Logo } from './Logo';

/**
 * RecruiterShell — authenticated recruiter-portal chrome. Distinct from the
 * public PageShell and the dark AdminShell. Shows an "acting as <company>"
 * banner because auth isn't wired yet (the recruiter id is a fixed demo
 * constant until the auth module lands).
 */

export type RecruiterNav = 'dashboard' | 'jds' | 'candidates' | 'interviews' | 'offers' | 'stats' | 'integrations';

export interface RecruiterShellProps {
  readonly children: ReactNode;
  readonly activeNav?: RecruiterNav;
  readonly companyName: string;
  readonly demoNotice?: boolean;
  /**
   * Top-right phase tag (plan §J): the active cycle phase + day + date,
   * e.g. a `StatusPill` reading "Interviews · Day 2 · 2 Jun". Rendered in the
   * header row beside the nav. Caller owns the content so the shell stays free
   * of `CYCLES`/`GUIDELINES` (no cross-module deep imports).
   */
  readonly phaseTag?: ReactNode;
  /**
   * Full-width rolling banner (plan §J) surfacing time-bound activities across
   * the top, above the header. Caller supplies a `Marquee`/`RollingBanner`
   * (with its own `prefers-reduced-motion` handling). Sits below the demo
   * notice and above the header so it spans the full viewport width.
   */
  readonly banner?: ReactNode;
}

const navItems: ReadonlyArray<{ key: RecruiterNav; href: string; label: string }> = [
  { key: 'dashboard', href: '/recruiter/dashboard', label: 'Dashboard' },
  { key: 'jds', href: '/recruiter/jds', label: 'Job descriptions' },
  { key: 'candidates', href: '/recruiter/candidates', label: 'Candidates' },
  { key: 'interviews', href: '/recruiter/interviews', label: 'Interviews' },
  { key: 'offers', href: '/recruiter/offers', label: 'Offers' },
  { key: 'stats', href: '/recruiter/stats', label: 'Your stats' },
  { key: 'integrations', href: '/recruiter/integrations', label: 'API & alerts' },
];

export function RecruiterShell({
  children,
  activeNav,
  companyName,
  demoNotice = true,
  phaseTag,
  banner,
}: RecruiterShellProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {demoNotice && (
        <div
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--text-on-accent)',
            paddingInline: 'var(--layout-page-x)',
            paddingBlock: 'var(--space-2)',
            fontSize: 'var(--fs-12)',
            fontWeight: 'var(--fw-600)',
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          Prototype · acting as <strong>{companyName}</strong> · authentication lands in a later milestone
        </div>
      )}

      {banner != null && (
        <div
          style={{
            backgroundColor: 'var(--surface-panel)',
            borderBottom: '1px solid var(--border-default)',
            overflow: 'hidden',
          }}
        >
          {banner}
        </div>
      )}

      <header
        style={{
          backgroundColor: 'var(--surface-card)',
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-5)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <a href="/recruiter/dashboard" style={{ textDecoration: 'none', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Logo height={30} />
            <span style={{ paddingLeft: 'var(--space-4)', borderLeft: '1px solid var(--border-default)' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-12)',
                  fontWeight: 'var(--fw-600)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Recruiter
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-20)',
                  fontWeight: 'var(--fw-500)',
                  color: 'var(--text-strong)',
                  marginTop: 'var(--space-1)',
                }}
              >
                {companyName}
              </span>
            </span>
          </a>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-5)',
              flexWrap: 'wrap',
            }}
          >
            <nav
              aria-label="Recruiter"
              style={{
                display: 'flex',
                gap: 'var(--space-5)',
                flexWrap: 'wrap',
                fontSize: 'var(--fs-14)',
                fontWeight: 'var(--fw-600)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {navItems.map((item) => {
                const isActive = item.key === activeNav;
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                      textDecoration: 'none',
                      paddingBlock: 'var(--space-1)',
                      borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      transition: 'color var(--motion-micro)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
            {phaseTag != null && <div style={{ display: 'inline-flex', alignItems: 'center' }}>{phaseTag}</div>}
          </div>
        </div>
      </header>

      <main id="main" style={{ flex: 1, backgroundColor: 'var(--surface-page)' }}>
        {children}
      </main>

      <footer
        style={{
          backgroundColor: 'var(--surface-panel)',
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-6)',
          borderTop: '1px solid var(--border-default)',
          fontSize: 'var(--fs-12)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          Need help? Contact your placement head · industry@nid.edu
        </div>
      </footer>
    </div>
  );
}
