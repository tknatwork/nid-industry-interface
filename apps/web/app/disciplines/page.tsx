import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { PageShell } from '@nid/ui';
import { DISCIPLINES } from '~/lib/public-content';
import { BentoDisciplineGrid } from '~/components/BentoDisciplineGrid';
import { DisciplineBrochure } from '~/components/DisciplineBrochure';

export const metadata: Metadata = {
  title: 'Disciplines · NID Industry Interface',
  description:
    'All twenty NID design disciplines — what each one produces, who it fits, and the full brochure. The institution maps your role to the disciplines whose graduates actually match.',
};

export default function DisciplinesPage() {
  return (
    <PageShell activeNav="disciplines">
      {/* Animated scroll-down cue keyframes. The global prefers-reduced-motion
          rule in globals.css neutralises this for users who opt out. */}
      <style>{scrollCueKeyframes}</style>

      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          {/* Intro — the §E hook. */}
          <p style={kicker}>The institution translates recruiter vocabulary into disciplines</p>
          <h1 style={h1}>Want to know about a discipline you have no idea about?</h1>
          <p style={lede}>
            NID runs {DISCIPLINES.length} design disciplines. Most recruiters know two or three of them by name —
            and have never heard of the rest. This page is the map: hover any tile to see what its graduates
            actually do, then read the full brochure for the disciplines whose work fits your roles.
          </p>

          {/* Animated scroll-down cue pointing at the grid. */}
          <a href="#discipline-grid" style={cueLink}>
            <span style={cueText}>Explore all {DISCIPLINES.length}</span>
            <span style={cueArrow} aria-hidden="true">
              ↓
            </span>
          </a>

          {/* Bento grid of all 20 — hover reveals each discipline's "what they do". */}
          <div id="discipline-grid" style={{ marginTop: 'var(--space-10)', scrollMarginTop: 'var(--space-8)' }}>
            <BentoDisciplineGrid />
          </div>

          {/* The one long scrollable brochure with the sticky 20-tab bar. */}
          <div id="brochure" style={{ marginTop: 'var(--space-16)', scrollMarginTop: 'var(--space-8)' }}>
            <p style={kicker}>The full brochure</p>
            <h2 style={h2}>Every discipline, in depth</h2>
            <p style={{ ...lede, marginBottom: 'var(--space-8)' }}>
              One continuous read. Use the sticky bar to jump to any discipline — it follows you as you scroll.
            </p>
            <DisciplineBrochure />
          </div>

          {/* Guidelines of Sponsorship CTA. */}
          <div style={ctaCard}>
            <div style={{ maxWidth: '640px' }}>
              <p style={ctaKicker}>Before you recruit</p>
              <h2 style={ctaTitle}>Read the Guidelines of Sponsorship</h2>
              <p style={ctaBody}>
                Eligibility, fees and GST, how JDs must be structured, conduct during the cycle, IPR on student
                portfolios, and the redressal process — the full rulebook every recruiter agrees to.
              </p>
            </div>
            <a href="/recruiters/guidelines" style={ctaButton}>
              Guidelines of Sponsorship →
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const scrollCueKeyframes = `
@keyframes nid-scroll-cue {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}`;

const kicker: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};
const h1: CSSProperties = {
  fontSize: 'var(--fs-48)',
  lineHeight: 'var(--lh-56)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-4)',
  maxWidth: '880px',
};
const h2: CSSProperties = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginBottom: 'var(--space-3)',
};
const lede: CSSProperties = {
  fontSize: 'var(--fs-18)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  maxWidth: '720px',
};

const cueLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-6)',
  textDecoration: 'none',
  color: 'var(--text-strong)',
};
const cueText: CSSProperties = {
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const cueArrow: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-emphasized)',
  color: 'var(--accent)',
  fontSize: 'var(--fs-18)',
  lineHeight: 1,
  animation: 'nid-scroll-cue 1.6s ease-in-out infinite',
};

const ctaCard: CSSProperties = {
  marginTop: 'var(--space-16)',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-6)',
  padding: 'var(--card-padding)',
  backgroundColor: 'var(--surface-panel)',
  borderRadius: 'var(--radius-4)',
  borderLeft: '4px solid var(--accent)',
};
const ctaKicker: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const ctaTitle: CSSProperties = {
  fontSize: 'var(--fs-24)',
  lineHeight: 'var(--lh-28)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginTop: 'var(--space-1)',
};
const ctaBody: CSSProperties = {
  fontSize: 'var(--fs-14)',
  lineHeight: 'var(--lh-23)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-secondary)',
  marginTop: 'var(--space-2)',
};
const ctaButton: CSSProperties = {
  flex: '0 0 auto',
  backgroundColor: 'var(--accent)',
  color: 'var(--accent-text)',
  borderRadius: 'var(--radius-pill)',
  padding: 'var(--space-3) var(--space-6)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-600)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};
