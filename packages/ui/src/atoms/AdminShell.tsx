import type { ReactNode } from 'react';
import { Logo } from './Logo';

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
  | 'content'
  // Coordinator-scoped surfaces (RBAC subset of /admin — plan §Q).
  | 'coordinator-companies'
  | 'coordinator-interviews'
  | 'coordinator-rounds';

/**
 * Admin actor role. `full-admin` is the placement-cell staff with the complete
 * nav (today's behaviour, the default). `coordinator` is a student coordinator
 * who sees a reduced, scoped nav (their assigned-companies dashboard plus the
 * interview / round-progress surfaces only) — plan §Q.
 */
export type AdminRole = 'full-admin' | 'coordinator';

export interface AdminShellProps {
  readonly children: ReactNode;
  readonly activeNav?: AdminNav;
  readonly roleLabel?: string; // e.g. 'Placement head — NID Ahmedabad'
  /**
   * Which nav the chrome renders. Defaults to `'full-admin'` so existing admin
   * pages are unchanged. `'coordinator'` renders the reduced scoped nav.
   */
  readonly role?: AdminRole;
}

const fullAdminNavItems: ReadonlyArray<{ key: AdminNav; href: string; label: string }> = [
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

// Coordinator's reduced nav: assigned-companies dashboard + interview/round
// surfaces only. No moderation, payment, blacklist, or content surfaces — those
// stay with full-admin (plan §Q: deny everything outside assigned companies).
const coordinatorNavItems: ReadonlyArray<{ key: AdminNav; href: string; label: string }> = [
  { key: 'coordinator-companies', href: '/admin/coordinator', label: 'My companies' },
  { key: 'coordinator-interviews', href: '/admin/coordinator/interviews', label: 'Interviews' },
  { key: 'coordinator-rounds', href: '/admin/coordinator/rounds', label: 'Round progress' },
];

const NAV_BY_ROLE: Record<AdminRole, ReadonlyArray<{ key: AdminNav; href: string; label: string }>> = {
  'full-admin': fullAdminNavItems,
  coordinator: coordinatorNavItems,
};

export function AdminShell({ children, activeNav, roleLabel, role = 'full-admin' }: AdminShellProps) {
  const navItems = NAV_BY_ROLE[role];
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
          <a href={role === 'coordinator' ? '/admin/coordinator' : '/admin'} style={{ textDecoration: 'none', color: 'var(--grey-0)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Logo height={30} />
            <span
              style={{
                fontSize: 'var(--fs-12)',
                fontWeight: 'var(--fw-600)',
                color: 'var(--grey-300)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                paddingLeft: 'var(--space-4)',
                borderLeft: '1px solid var(--grey-700)',
              }}
            >
              {role === 'coordinator' ? 'Placement Cell · Coordinator' : 'Placement Cell · Admin'}
            </span>
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
          {navItems.map((item) => {
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
