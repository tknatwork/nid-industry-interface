import { PageShell, Button } from '@nid/ui';

/**
 * Public landing — `/` per Phase 3.2 sitemap.
 *
 * Foundational stub that proves out the design tokens + shared PageShell.
 * Real landing-page content (cycles, past recruiters wall, full discipline catalog)
 * lands in later milestones.
 */
export default function LandingPage() {
  return (
    <PageShell>
      <section
        style={{
          paddingInline: 'var(--layout-page-x)',
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
          <h1
            style={{
              fontSize: 'var(--fs-48)',
              lineHeight: 'var(--lh-56)',
              fontWeight: 'var(--fw-500)',
              color: 'var(--text-strong)',
              maxWidth: '780px',
            }}
          >
            One portal. Three legacy campuses. Twenty disciplines. Designed students, ready for industry.
          </h1>
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
            R&amp;D campuses. Apply once, get a token, track your application through every step, and engage with
            our placement cell on a single coherent surface.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-8)', flexWrap: 'wrap' }}>
            <a href="/apply" style={{ textDecoration: 'none' }}>
              <Button size="lg">Apply to recruit</Button>
            </a>
            <a href="/track" style={{ textDecoration: 'none' }}>
              <Button size="lg" variant="secondary">
                Track your application
              </Button>
            </a>
            <a href="/playground" style={{ textDecoration: 'none' }}>
              <Button size="lg" variant="ghost">
                ▶ 3-up playground
              </Button>
            </a>
          </div>

          <div
            style={{
              marginTop: 'var(--space-10)',
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--fs-12)',
                fontWeight: 'var(--fw-600)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 'var(--space-3)',
              }}
            >
              Prototype surfaces
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-600)' }}>
              <a href="/recruiter/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                Recruiter portal →
              </a>
              <a href="/playground" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                3-up playground (recruiter live + admin/student reference) →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          backgroundColor: 'var(--surface-panel)',
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--layout-section-y)',
        }}
      >
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'var(--fs-24)',
              lineHeight: 'var(--lh-28)',
              fontWeight: 'var(--fw-500)',
              color: 'var(--text-strong)',
              marginBottom: 'var(--space-6)',
            }}
          >
            Disciplines at a glance
          </h2>
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
                <h3
                  style={{
                    fontSize: 'var(--fs-18)',
                    lineHeight: 'var(--lh-23)',
                    fontWeight: 'var(--fw-600)',
                    color: 'var(--text-strong)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {d.name}
                </h3>
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
    </PageShell>
  );
}

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
