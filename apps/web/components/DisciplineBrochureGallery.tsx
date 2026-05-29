'use client';

import { useRef } from 'react';
import { DISCIPLINES } from '~/lib/public-content';

/**
 * Discipline brochure showcase — a horizontal sliding gallery of "what each
 * discipline offers", with a Download button top-right. Native CSS scroll-snap
 * does the sliding; the ‹ › buttons just scrollBy a card width (no carousel lib,
 * touch/trackpad works without JS, honors prefers-reduced-motion). Each card
 * themes to its discipline colour via data-discipline (semantic token override).
 */

function buildBrochureMarkdown(): string {
  const lines = ['# NID Industry Interface — Discipline Brochures', ''];
  for (const d of DISCIPLINES) {
    lines.push(`## ${d.name}  (${d.programme})`, '', d.summary, '', 'What graduates do:');
    for (const w of d.whatTheyDo) lines.push(`- ${w}`);
    lines.push('', `Sample work: ${d.sampleWork}`, '', '---', '');
  }
  return lines.join('\n');
}

export function DisciplineBrochureGallery() {
  const scroller = useRef<HTMLDivElement>(null);

  const slide = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.9, 360), behavior: 'smooth' });
  };

  const download = () => {
    const blob = new Blob([buildBrochureMarkdown()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NID-Discipline-Brochures.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-label="Discipline brochures">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <div>
          <p style={kicker}>Brochures</p>
          <h2 style={h2}>What each discipline offers</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button onClick={() => slide(-1)} style={arrowBtn} aria-label="Previous brochures">‹</button>
          <button onClick={() => slide(1)} style={arrowBtn} aria-label="Next brochures">›</button>
          <button onClick={download} style={downloadBtn}>↓ Download brochure</button>
        </div>
      </div>

      <div
        ref={scroller}
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          paddingBottom: 'var(--space-3)',
        }}
      >
        {DISCIPLINES.map((d) => (
          <article
            key={d.slug}
            data-discipline={d.theme}
            style={{
              flex: '0 0 320px',
              scrollSnapAlign: 'start',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--card-radius)',
              boxShadow: 'var(--card-shadow)',
              borderTop: '4px solid var(--accent)',
              padding: 'var(--card-padding)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <p style={{ ...kicker, color: 'var(--accent)' }}>{d.programme}</p>
            <h3 style={{ fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' }}>
              {d.name}
            </h3>
            <p style={{ fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-18)', fontWeight: 'var(--fw-300)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              {d.summary}
            </p>
            <p style={{ ...miniLabel, marginTop: 'var(--space-4)' }}>What graduates do</p>
            <ul style={{ margin: 'var(--space-1) 0 0', paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-14)', color: 'var(--text-primary)', display: 'grid', gap: '2px' }}>
              {d.whatTheyDo.map((w) => <li key={w}>{w}</li>)}
            </ul>
            <p style={{ ...miniLabel, marginTop: 'var(--space-4)' }}>Sample work</p>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)', marginTop: '2px' }}>{d.sampleWork}</p>
            <a href={`/disciplines/${d.slug}`} style={{ marginTop: 'auto', paddingTop: 'var(--space-3)', color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)', fontSize: 'var(--fs-14)' }}>
              Full brochure →
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

const kicker: React.CSSProperties = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' };
const miniLabel: React.CSSProperties = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' };
const h2: React.CSSProperties = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: '2px' };
const arrowBtn: React.CSSProperties = {
  width: '36px', height: '36px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-emphasized)',
  background: 'var(--surface-card)', color: 'var(--text-strong)', fontSize: 'var(--fs-20)', lineHeight: 1, cursor: 'pointer',
};
const downloadBtn: React.CSSProperties = {
  background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 'var(--radius-pill)',
  padding: 'var(--space-2) var(--space-5)', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', cursor: 'pointer', whiteSpace: 'nowrap',
};
