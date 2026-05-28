import type { ReactNode } from 'react';

/**
 * RecruiterShell — authenticated recruiter-portal chrome. Distinct from the
 * public PageShell and the dark AdminShell. Shows an "acting as <company>"
 * banner because auth isn't wired yet (the recruiter id is a fixed demo
 * constant until the auth module lands).
 */

export type RecruiterNav = 'dashboard' | 'jds' | 'candidates' | 'interviews' | 'offers' | 'stats';

export interface RecruiterShellProps {
  readonly children: ReactNode;
  readonly activeNav?: RecruiterNav;
  readonly companyName: string;
  readonly demoNotice?: boolean;
}

const navItems: ReadonlyArray<{ key: RecruiterNav; href: string; label: string }> = [
  { key: 'dashboard', href: '/recruiter/dashboard', label: 'Dashboard' },
  { key: 'jds', href: '/recruiter/jds', label: 'Job descriptions' },
  { key: 'candidates', href: '/recruiter/candidates', label: 'Candidates' },
  { key: 'interviews', href: '/recruiter/interviews', label: 'Interviews' },
  { key: 'offers', href: '/recruiter/offers', label: 'Offers' },
  { key: 'stats', href: '/recruiter/stats', label: 'Your stats' },
];

export function RecruiterShell({
  children,
  activeNav,
  companyName,
  demoNotice = true,
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
          <a href="/recruiter/dashboard" style={{ textDecoration: 'none' }}>
            <p
              style={{
                fontSize: 'var(--fs-12)',
                fontWeight: 'var(--fw-600)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              NID Industry Interface · Recruiter
            </p>
            <p
              style={{
                fontSize: 'var(--fs-20)',
                fontWeight: 'var(--fw-500)',
                color: 'var(--text-strong)',
                marginTop: 'var(--space-1)',
              }}
            >
              {companyName}
            </p>
          </a>
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
