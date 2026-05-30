import { PageShell, Button } from '@nid/ui';
import { PlacementTimetable } from '~/components/PlacementTimetable';
import { RecruiterLogoWall } from '~/components/RecruiterLogoWall';

/**
 * Public landing — `/` per Phase 3.2 sitemap.
 *
 * Round 2 §B hero: a two-column split. LEFT carries the "Hire from NID" pitch
 * (eyebrow, headline, body, CTAs, prototype links); RIGHT is the
 * auto-scrolling recruiter logo wall — the trust signal that leads the page
 * instead of a brochure teaser. The PlacementTimetable band follows.
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
        <div
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'var(--space-12)',
          }}
        >
          {/* LEFT — the pitch */}
          <div style={{ flex: '1 1 420px', minWidth: 'min(100%, 420px)' }}>
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
                maxWidth: '560px',
                marginTop: 'var(--space-6)',
              }}
            >
              The Industry Interface portal connects recruiters with NID&rsquo;s Ahmedabad, Gandhinagar, and Bengaluru
              R&amp;D campuses. Apply once, get a ticket, track your application through every step, and engage with
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
              <a href="/recruiters/guidelines" style={{ textDecoration: 'none' }}>
                <Button size="lg" variant="secondary">
                  Guidelines of Sponsorship
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

          {/* RIGHT — recruiter trust wall */}
          <div style={{ flex: '1 1 360px', minWidth: 'min(100%, 320px)' }}>
            <RecruiterLogoWall />
          </div>
        </div>
      </section>

      {/* Placement timetable — first-glance schedule (mirrors the live II homepage). */}
      <section
        style={{
          paddingInline: 'var(--layout-page-x)',
          paddingBlock: 'var(--layout-section-y)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <PlacementTimetable />
        </div>
      </section>
    </PageShell>
  );
}
