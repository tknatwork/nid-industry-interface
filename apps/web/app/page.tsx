/**
 * Public landing — `/` per Phase 3.2 sitemap.
 *
 * This is a foundational stub that proves out the design tokens. Real
 * landing-page content (cycles + disciplines + past recruiters wall) lands
 * in later milestones.
 */

export default function LandingPage() {
  return (
    <main id="main" className="min-h-screen">
      <header
        style={{
          padding: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-8)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
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
            <h1
              style={{
                fontSize: 'var(--fs-24)',
                lineHeight: 'var(--lh-28)',
                fontWeight: 'var(--fw-500)',
                color: 'var(--text-strong)',
                marginTop: 'var(--space-1)',
              }}
            >
              Industry Interface
            </h1>
          </div>
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
            <a href="/recruiters/process" style={navLinkStyle}>
              Process
            </a>
            <a href="/disciplines" style={navLinkStyle}>
              Disciplines
            </a>
            <a href="/cycles" style={navLinkStyle}>
              Cycles
            </a>
            <a href="/contact" style={navLinkStyle}>
              Contact
            </a>
            <a href="/apply" style={{ ...navLinkStyle, color: 'var(--accent)' }}>
              Apply
            </a>
          </nav>
        </div>
      </header>

      <section
        style={{
          padding: 'var(--layout-page-x)',
          paddingBlock: 'var(--layout-section-y)',
        }}
      >
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <p
            style={{
              fontSize: 'var(--fs-14)',
              fontWeight: 'var(--fw-600)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 'var(--space-3)',
            }}
          >
            Hire from NID
          </p>
          <h2
            style={{
              fontSize: 'var(--fs-48)',
              lineHeight: 'var(--lh-56)',
              fontWeight: 'var(--type-h1-weight)',
              color: 'var(--text-strong)',
              maxWidth: '780px',
            }}
          >
            One portal. Three legacy campuses. Twenty disciplines. Designed students, ready for industry.
          </h2>
          <p
            style={{
              fontSize: 'var(--fs-18)',
              lineHeight: 'var(--lh-30)',
              fontWeight: 'var(--fw-300)',
              color: 'var(--text-primary)',
              maxWidth: '680px',
              marginTop: 'var(--space-6)',
            }}
          >
            The Industry Interface portal connects recruiters with NID&rsquo;s Ahmedabad, Gandhinagar, and Bengaluru
            R&amp;D campuses. Apply once, get a token, track your application through every step, and engage with our
            placement cell on a single coherent surface.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            <a
              href="/apply"
              style={{
                ...buttonStyle,
                backgroundColor: 'var(--accent)',
                color: 'var(--text-on-accent)',
              }}
            >
              Apply to recruit
            </a>
            <a
              href="/track"
              style={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                color: 'var(--text-strong)',
                border: '1px solid var(--border-emphasized)',
              }}
            >
              Track your application
            </a>
          </div>
        </div>
      </section>

      {/* Token sanity check: discipline accents render correctly */}
      <section
        style={{
          backgroundColor: 'var(--surface-panel)',
          padding: 'var(--layout-page-x)',
          paddingBlock: 'var(--layout-section-y)',
        }}
      >
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <h3
            style={{
              fontSize: 'var(--fs-24)',
              lineHeight: 'var(--lh-28)',
              fontWeight: 'var(--fw-500)',
              color: 'var(--text-strong)',
              marginBottom: 'var(--space-6)',
            }}
          >
            Disciplines at a glance
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {DISCIPLINE_PREVIEW.map((d) => (
              <article
                key={d.slug}
                data-discipline={d.theme}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--card-radius)',
                  padding: 'var(--card-padding)',
                  boxShadow: 'var(--card-shadow)',
                  borderTop: '3px solid var(--accent)',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--fs-12)',
                    fontWeight: 'var(--fw-600)',
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {d.programme}
                </p>
                <h4
                  style={{
                    fontSize: 'var(--fs-18)',
                    lineHeight: 'var(--lh-23)',
                    fontWeight: 'var(--fw-600)',
                    color: 'var(--text-strong)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {d.name}
                </h4>
                <p
                  style={{
                    fontSize: 'var(--fs-14)',
                    lineHeight: 'var(--lh-18)',
                    fontWeight: 'var(--fw-300)',
                    color: 'var(--text-secondary)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  {d.summary}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer
        style={{
          backgroundColor: 'var(--surface-panel)',
          padding: 'var(--layout-page-x)',
          paddingBlock: 'var(--space-12)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            fontSize: 'var(--fs-12)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <p>For any query please contact industry@nid.edu</p>
          <p style={{ marginTop: 'var(--space-2)' }}>
            &copy; NID Industry Interface · Prototype build, milestone 1.
          </p>
        </div>
      </footer>
    </main>
  );
}

const navLinkStyle = {
  color: 'var(--text-primary)',
  textDecoration: 'none',
  transition: 'color var(--motion-micro)',
};

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--btn-padding-y) var(--btn-padding-x)',
  borderRadius: 'var(--btn-radius)',
  fontSize: 'var(--fs-16)',
  fontWeight: 'var(--fw-500)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  textDecoration: 'none',
  transition: 'all var(--btn-motion)',
};

const DISCIPLINE_PREVIEW = [
  {
    slug: 'communication-design',
    name: 'Communication Design',
    programme: 'B.Des',
    theme: 'communication',
    summary: 'Visual systems, typography, brand, editorial, and motion graphics.',
  },
  {
    slug: 'industrial-design',
    name: 'Industrial Design',
    programme: 'B.Des',
    theme: 'industrial',
    summary: 'Form, function, and manufacturability across consumer and B2B products.',
  },
  {
    slug: 'interaction-design',
    name: 'Interaction Design',
    programme: 'M.Des',
    theme: 'ux',
    summary: 'UX research, interaction patterns, and human-centered systems.',
  },
  {
    slug: 'textile-design',
    name: 'Textile Design',
    programme: 'B.Des / M.Des',
    theme: 'textile',
    summary: 'Fabric, surface, and material across apparel and home textiles.',
  },
  {
    slug: 'animation-film-design',
    name: 'Animation Film',
    programme: 'M.Des',
    theme: 'animation',
    summary: '2D, 3D, and stop-motion for film, advertising, and interactive media.',
  },
  {
    slug: 'furniture-interior-design',
    name: 'Furniture & Interior',
    programme: 'M.Des',
    theme: 'furniture',
    summary: 'Spatial design, furniture, and interior product.',
  },
] as const;
