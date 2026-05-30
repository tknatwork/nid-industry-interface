'use client';

import { useState, type CSSProperties } from 'react';
import { Tabs, type TabItem } from '@nid/ui';
import { DISCIPLINES } from '~/lib/public-content';

/**
 * DisciplineBrochure — ONE long scrollable brochure of all 20 NID disciplines
 * (plan §E), fronted by a sticky 20-tab bar driven by the shared `Tabs`
 * primitive in its `scrollSpy` mode. Clicking a tab smooth-scrolls to that
 * discipline's section; the active tab follows the section currently in view
 * (IntersectionObserver inside `Tabs`). This replaces the old per-discipline
 * brochure buttons with a single continuous read.
 *
 * Client component: `Tabs` scroll-spy owns a scroll observer, and we mirror its
 * active section to colour-theme the whole brochure (the active discipline's
 * `data-discipline` accent flows into the sticky bar and section rules). The
 * `STICKY_OFFSET` keeps the bar clear of the page header and is passed to
 * `Tabs` so its scroll-into-view maths line up with the sticky bar.
 *
 * Sections carry `id={slug}` and `scroll-margin-top` so both the tab jumps and
 * any inbound `/disciplines#<slug>` hash (e.g. from the bento grid above) land
 * with the heading clear of the sticky bar.
 */

const STICKY_OFFSET = 64;

/**
 * Compact tab labels: the full discipline names are long (e.g. "Transportation
 * and Automobile Design"), so the sticky bar uses a shortened label while each
 * section heading shows the full name. Falls back to the full name when no
 * short form is defined.
 */
const SHORT_LABELS: Readonly<Record<string, string>> = {
  'industrial-design': 'Industrial',
  'communication-design': 'Communication',
  'textile-design': 'Textile',
  'animation-film-design': 'Animation Film',
  'apparel-design': 'Apparel',
  'ceramic-glass-design': 'Ceramic & Glass',
  'film-video-communication': 'Film & Video',
  'furniture-interior-design': 'Furniture & Interior',
  'graphic-design': 'Graphic',
  'information-design': 'Information',
  'interaction-design': 'Interaction',
  'lifestyle-accessory-design': 'Lifestyle & Accessory',
  'new-media-design': 'New Media',
  'photography-design': 'Photography',
  'product-design': 'Product',
  'strategic-design-management': 'Strategic Design Mgmt',
  'toy-game-design': 'Toy & Game',
  'transportation-automobile-design': 'Transportation',
  'universal-design': 'Universal',
  'digital-game-design': 'Digital Game',
};

export function DisciplineBrochure() {
  const [activeSlug, setActiveSlug] = useState<string>(DISCIPLINES[0]?.slug ?? '');

  // Theme the whole brochure to the active discipline; fall back to the first
  // discipline's theme so the accent is always a concrete value.
  const activeTheme =
    DISCIPLINES.find((d) => d.slug === activeSlug)?.theme ?? DISCIPLINES[0]?.theme ?? 'communication';

  const tabItems: TabItem[] = DISCIPLINES.map((d, index) => ({
    id: d.slug,
    label: (
      <span style={tabLabelStyle}>
        <span style={tabNumStyle}>{String(index + 1).padStart(2, '0')}</span>
        {SHORT_LABELS[d.slug] ?? d.name}
      </span>
    ),
    targetId: d.slug,
  }));

  return (
    // The active discipline's accent themes the whole brochure (sticky bar +
    // section rules) via the semantic [data-discipline] token override.
    <div data-discipline={activeTheme}>
      <Tabs
        scrollSpy
        variant="pill"
        aria-label="Jump to a discipline"
        sticky
        stickyOffset={STICKY_OFFSET}
        items={tabItems}
        onActiveChange={setActiveSlug}
        barStyle={stickyBarStyle}
      />

      <div style={sectionsWrapStyle}>
        {DISCIPLINES.map((d, index) => (
          <section
            key={d.slug}
            id={d.slug}
            data-discipline={d.theme}
            aria-labelledby={`${d.slug}-heading`}
            style={sectionStyle}
          >
            <p style={sectionKickerStyle}>
              {String(index + 1).padStart(2, '0')} · {d.programme}
            </p>
            <h2 id={`${d.slug}-heading`} style={sectionTitleStyle}>
              {d.name}
            </h2>
            <p style={sectionLedeStyle}>{d.summary}</p>

            <div style={sectionGridStyle}>
              <div>
                <p style={blockLabelStyle}>What graduates do</p>
                <ul style={whatListStyle}>
                  {d.whatTheyDo.map((w) => (
                    <li key={w} style={whatItemStyle}>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={blockLabelStyle}>Sample work</p>
                <p style={sampleStyle}>{d.sampleWork}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

const tabLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
};

const tabNumStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-700)',
  opacity: 0.6,
};

/**
 * The sticky bar gets a solid page background and a soft shadow so it stays
 * legible over scrolling sections, plus padding to feel like a real toolbar.
 * `Tabs` already applies position:sticky + the page background; this layers the
 * shadow + spacing + horizontal scroll affordance for 20 pills.
 */
const stickyBarStyle: CSSProperties = {
  paddingBlock: 'var(--space-3)',
  marginBottom: 'var(--space-6)',
  boxShadow: 'var(--shadow-1)',
  borderRadius: 'var(--radius-2)',
  paddingInline: 'var(--space-3)',
  overflowX: 'auto',
};

const sectionsWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-12)',
};

const sectionStyle: CSSProperties = {
  scrollMarginTop: `${STICKY_OFFSET + 72}px`,
  paddingTop: 'var(--space-6)',
  borderTop: '3px solid var(--accent)',
};

const sectionKickerStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  marginBottom: 'var(--space-2)',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  margin: 0,
};

const sectionLedeStyle: CSSProperties = {
  fontSize: 'var(--fs-18)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  marginTop: 'var(--space-3)',
  maxWidth: '720px',
};

const sectionGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 'var(--space-6)',
  marginTop: 'var(--space-6)',
};

const blockLabelStyle: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-3)',
};

const whatListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gap: 'var(--space-2)',
};

const whatItemStyle: CSSProperties = {
  paddingLeft: 'var(--space-3)',
  fontSize: 'var(--fs-16)',
  lineHeight: 'var(--lh-23)',
  color: 'var(--text-primary)',
  // Accent tick via a border-left marker so each discipline's colour reads.
  borderLeft: '2px solid var(--accent)',
};

const sampleStyle: CSSProperties = {
  fontSize: 'var(--fs-16)',
  lineHeight: 'var(--lh-30)',
  fontWeight: 'var(--fw-300)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--surface-panel)',
  borderRadius: 'var(--radius-3)',
  padding: 'var(--card-padding)',
};
