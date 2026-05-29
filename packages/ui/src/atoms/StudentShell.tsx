import type { ReactNode } from 'react';
import { Logo } from './Logo';

/**
 * StudentShell — the light student-portal chrome (Phase 3.5). Distinct from the
 * recruiter and admin shells. Shows an "acting as <student>" banner because
 * auth/SSO isn't wired yet (the student id is a fixed demo constant until the
 * auth module lands).
 */

export type StudentNav =
  | 'dashboard'
  | 'cycles'
  | 'jds'
  | 'applications'
  | 'offers'
  | 'profile'
  | 'conduct'
  | 'report';

export interface StudentShellProps {
  readonly children: ReactNode;
  readonly activeNav?: StudentNav;
  readonly studentName: string;
  readonly demoNotice?: boolean;
}

const navItems: ReadonlyArray<{ key: StudentNav; href: string; label: string }> = [
  { key: 'dashboard', href: '/student', label: 'Dashboard' },
  { key: 'cycles', href: '/student/cycles', label: 'Cycles' },
  { key: 'jds', href: '/student/jds', label: 'Openings' },
  { key: 'applications', href: '/student/applications', label: 'Applications' },
  { key: 'offers', href: '/student/offers', label: 'Offers' },
  { key: 'profile', href: '/student/profile', label: 'Profile' },
  { key: 'conduct', href: '/student/conduct', label: 'Conduct' },
  { key: 'report', href: '/student/report-company', label: 'Report' },
];

export function StudentShell({
  children,
  activeNav,
  studentName,
  demoNotice = true,
}: StudentShellProps) {
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
          Prototype · signed in as <strong>{studentName}</strong> · SSO from nid.edu lands in a later milestone
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
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <a href="/student" style={{ textDecoration: 'none', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)' }}>
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
                Student
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
                {studentName}
              </span>
            </span>
          </a>
          <nav
            aria-label="Student"
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
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          Your placement is the choice of the student · talk to your student coordinator any time
        </div>
      </footer>
    </div>
  );
}
