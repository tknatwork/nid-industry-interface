import type { ReactNode } from 'react';
import { Logo } from './Logo';

/**
 * PageShell — shared header + footer layout for public pages.
 * Lifts the surface into a consistent visual frame.
 */

export interface PageShellProps {
  readonly children: ReactNode;
  readonly activeNav?:
    | 'process'
    | 'disciplines'
    | 'cycles'
    | 'contact'
    | 'login'
    | 'apply'
    | 'track';
}

const navItems = [
  { key: 'process', href: '/recruiters/process', label: 'Process' },
  { key: 'cycles', href: '/cycles', label: 'Timeline' },
  { key: 'disciplines', href: '/disciplines', label: 'Disciplines' },
  { key: 'contact', href: '/contact', label: 'Contact' },
  { key: 'login', href: '/login', label: 'Login' },
] as const;

/**
 * Placement-cell contact block, mirroring how the live II site footer surfaces
 * the Ahmedabad placement office. The registrar matches
 * `apps/web/lib/recruiter-public.ts → PLACEMENT_HEADS[0]` (Sujitha Nair, Ahmedabad).
 * Inlined here rather than imported because PageShell is a generic `@nid/ui`
 * atom — pulling app-level data in would invert the package→app dependency.
 */
const footerColumns = [
  {
    heading: 'Useful Links',
    links: [
      { href: '/recruiters/process', label: 'Recruiter Process' },
      { href: '/recruiters/guidelines', label: 'Guidelines of Sponsorship' },
      { href: '/cycles', label: 'Placement Timeline' },
      { href: '/track', label: 'Track an Application' },
      { href: '/recruiters/faq', label: 'FAQ' },
    ],
  },
  {
    heading: 'Programmes',
    links: [
      // §F: the public surface drops the coordinator/escalation directory and
      // the "Brochures" label. The footer renders on every public page, so it
      // must not re-expose /contact/placement-heads or /contact/coordinators.
      { href: '/disciplines', label: 'Disciplines' },
      { href: '/recruiters/past', label: 'Past Recruiters' },
      { href: '/contact', label: 'Placements Office' },
      { href: '/campuses', label: 'Campuses' },
    ],
  },
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
          {/* Header masthead: the Industry Interface logo only — matching the
              official site, which carries no "National Institute of Design"
              wordmark above the logo. */}
          <a href="/" style={{ textDecoration: 'none', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center' }}>
            <Logo height={32} />
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
          color: 'var(--text-secondary)',
        }}
      >
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-8)',
          }}
        >
          {footerColumns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2
                style={{
                  fontSize: 'var(--fs-12)',
                  fontWeight: 'var(--fw-600)',
                  color: 'var(--text-strong)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '0 0 var(--space-4)',
                }}
              >
                {column.heading}
              </h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: 'var(--fs-14)',
                        transition: 'color var(--motion-micro)',
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <section aria-label="Contact">
            <h2
              style={{
                fontSize: 'var(--fs-12)',
                fontWeight: 'var(--fw-600)',
                color: 'var(--text-strong)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                margin: '0 0 var(--space-4)',
              }}
            >
              Contact
            </h2>
            <address
              style={{
                fontStyle: 'normal',
                fontSize: 'var(--fs-14)',
                lineHeight: 'var(--lh-23)',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <span style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-600)' }}>
                Industry Interface &amp; Placement Cell
              </span>
              <span>
                National Institute of Design
                <br />
                Paldi, Ahmedabad 380 007, Gujarat
              </span>
              <span>
                Sujitha Nair
                <br />
                Assistant Registrar — Placements
              </span>
              <a
                href="mailto:industryinterface@nid.edu"
                style={{ color: 'var(--accent)', textDecoration: 'none' }}
              >
                industryinterface@nid.edu
              </a>
              <a href="tel:+917926623692" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                +91 79 2662 3692
              </a>
            </address>
          </section>
        </div>

        <div
          style={{
            maxWidth: '1140px',
            margin: 'var(--space-10) auto 0',
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--border-default)',
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
          <p style={{ margin: 0 }}>&copy; National Institute of Design · Industry Interface</p>
          <p style={{ margin: 0 }}>Prototype · milestone 2</p>
        </div>
      </footer>
    </div>
  );
}
