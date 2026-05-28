import type { ReactNode } from 'react';

/**
 * PageShell — shared header + footer layout for public pages.
 * Lifts the surface into a consistent visual frame.
 */

export interface PageShellProps {
  readonly children: ReactNode;
  readonly activeNav?: 'process' | 'disciplines' | 'cycles' | 'contact' | 'apply' | 'track';
}

const navItems = [
  { key: 'process', href: '/recruiters/process', label: 'Process' },
  { key: 'disciplines', href: '/disciplines', label: 'Disciplines' },
  { key: 'cycles', href: '/cycles', label: 'Cycles' },
  { key: 'contact', href: '/contact', label: 'Contact' },
  { key: 'apply', href: '/apply', label: 'Apply' },
] as const;

export function PageShell({ children, activeNav }: PageShellProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-6)',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--surface-card)',
        }}
      >
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <a href="/" style={{ textDecoration: 'none' }}>
            <p
              style={{
                fontSize: 'var(--fs-12)',
                fontWeight: 'var(--fw-600)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              National Institute of Design
            </p>
            <p
              style={{
                fontSize: 'var(--fs-20)',
                lineHeight: 'var(--lh-23)',
                fontWeight: 'var(--fw-500)',
                color: 'var(--text-strong)',
                marginTop: 'var(--space-1)',
              }}
            >
              Industry Interface
            </p>
          </a>
          <nav
            aria-label="Primary"
            style={{
              display: 'flex',
              gap: 'var(--space-6)',
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
                    borderBottom: isActive
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                    transition: 'color var(--motion-micro), border-color var(--motion-micro)',
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      <main id="main" style={{ flex: 1 }}>
        {children}
      </main>

      <footer
        style={{
          backgroundColor: 'var(--surface-panel)',
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-12)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-6)',
            fontSize: 'var(--fs-12)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <p>For any query please contact industry@nid.edu</p>
          <p>&copy; NID Industry Interface · prototype, milestone 2.</p>
        </div>
      </footer>
    </div>
  );
}
