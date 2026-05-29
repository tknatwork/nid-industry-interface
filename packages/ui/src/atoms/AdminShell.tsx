import type { ReactNode } from 'react';

/**
 * AdminShell — placement-cell portal chrome. Visually distinct from PageShell
 * (which is the public surface) so admins always know which surface they're
 * on. Darker top bar, no global landing nav, role chip.
 */

export type AdminNav =
  | 'queue'
  | 'recruiters'
  | 'jds'
  | 'cycles'
  | 'health-scores'
  | 'redressal'
  | 'blacklist'
  | 'payment-cell'
  | 'offer-adjustments'
  | 'api-keys'
  | 'student-conduct'
  | 'slots'
  | 'engagement'
  | 'content';

export interface AdminShellProps {
  readonly children: ReactNode;
  readonly activeNav?: AdminNav;
  readonly roleLabel?: string; // e.g. 'Placement head — NID Ahmedabad'
}

const adminNavItems: ReadonlyArray<{ key: AdminNav; href: string; label: string }> = [
  { key: 'queue', href: '/admin/recruiters/queue', label: 'Recruiter queue' },
  { key: 'jds', href: '/admin/jds', label: 'JDs' },
  { key: 'cycles', href: '/admin/cycles', label: 'Cycles' },
  { key: 'health-scores', href: '/admin/health-scores', label: 'Health scores' },
  { key: 'redressal', href: '/admin/redressal', label: 'Redressal' },
  { key: 'student-conduct', href: '/admin/student-conduct', label: 'Conduct' },
  { key: 'blacklist', href: '/admin/blacklist', label: 'Blacklist' },
  { key: 'payment-cell', href: '/admin/payment-cell', label: 'Payment cell' },
  { key: 'offer-adjustments', href: '/admin/offer-adjustments', label: 'Offer adj.' },
  { key: 'api-keys', href: '/admin/api-keys', label: 'API keys' },
  { key: 'slots', href: '/admin/slots', label: 'Interview slots' },
  { key: 'engagement', href: '/admin/engagement', label: 'PPT & meetings' },
  { key: 'content', href: '/admin/content', label: 'Content' },
];

export function AdminShell({ children, activeNav, roleLabel }: AdminShellProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          backgroundColor: 'var(--grey-900)',
          color: 'var(--grey-0)',
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-5)',
          borderBottom: '3px solid var(--accent)',
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
          <a href="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>
            <p
              style={{
                fontSize: 'var(--fs-12)',
                fontWeight: 'var(--fw-600)',
                color: 'var(--grey-300)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              NID Industry Interface
            </p>
            <p
              style={{
                fontSize: 'var(--fs-20)',
                fontWeight: 'var(--fw-500)',
                color: 'var(--grey-0)',
                marginTop: 'var(--space-1)',
              }}
            >
              Placement Cell · Admin
            </p>
          </a>
          {roleLabel && (
            <span
              style={{
                fontSize: 'var(--fs-12)',
                fontWeight: 'var(--fw-600)',
                color: 'var(--grey-300)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                paddingBlock: 'var(--space-1)',
                paddingInline: 'var(--space-3)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--grey-700)',
              }}
            >
              {roleLabel}
            </span>
          )}
        </div>
      </header>

      <nav
        aria-label="Admin"
        style={{
          backgroundColor: 'var(--grey-700)',
          color: 'var(--grey-0)',
          paddingInline: 'var(--layout-page-x)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            gap: 'var(--space-6)',
            overflowX: 'auto',
          }}
        >
          {adminNavItems.map((item) => {
            const isActive = item.key === activeNav;
            return (
              <a
                key={item.key}
                href={item.href}
                style={{
                  color: isActive ? 'var(--grey-0)' : 'var(--grey-300)',
                  textDecoration: 'none',
                  fontSize: 'var(--fs-14)',
                  fontWeight: 'var(--fw-600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  paddingBlock: 'var(--space-3)',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'color var(--motion-micro)',
                }}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>

      <main id="main" style={{ flex: 1, backgroundColor: 'var(--surface-page)' }}>
        {children}
      </main>

      <footer
        style={{
          backgroundColor: 'var(--surface-panel)',
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-6)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            fontSize: 'var(--fs-12)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <p>NID Placement Cell — admin portal · prototype, milestone 2.</p>
          <a href="/" style={{ color: 'var(--text-secondary)' }}>
            ← back to public site
          </a>
        </div>
      </footer>
    </div>
  );
}
