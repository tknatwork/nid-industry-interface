import type { Metadata } from 'next';
import { PageShell } from '@nid/ui';

export const metadata: Metadata = {
  title: 'For recruiters · NID Industry Interface',
  description:
    'Why hire from NID, how the recruiter process works, sponsorship guidelines, FAQ, past recruiters, and the stipend calculator.',
};

const WHY = [
  {
    title: 'Twenty design disciplines, one intake',
    body: 'Communication, industrial, product, textile, animation, interaction, and furniture & interior design graduates — all reachable through a single cycle, mapped to your role vocabulary.',
  },
  {
    title: 'Individual evaluation, never pre-ranked',
    body: 'The portal never ranks, scores, or filters students for you. You evaluate each candidate yourself, with a recorded note — no black box, no bulk shortlist.',
  },
  {
    title: 'Transparent floors, no surprise rejections',
    body: 'Compensation floors are published up front. Check your role against the stipend calculator before you apply; there is no hidden gate at submission.',
  },
  {
    title: 'No login to start',
    body: 'Apply from the public site, get a tracking token immediately, and follow your application through every step. Credentials are issued only once you are verified.',
  },
];

const LINKS = [
  { href: '/recruiters/process', kicker: 'How it works', title: 'The recruiter process', body: 'The eight steps from applying to running the offer cascade.' },
  { href: '/recruiters/guidelines', kicker: 'Read first', title: 'Sponsorship guidelines', body: 'Eligibility, fees, JD structure, conduct, IPR, and redressal.' },
  { href: '/recruiters/faq', kicker: 'Quick answers', title: 'Frequently asked questions', body: 'Fees, eligibility, stipend floors, lateral hiring, and more.' },
  { href: '/recruiters/past', kicker: 'Track record', title: 'Past recruiters', body: 'Organisations that have recruited here over the last five years.' },
  { href: '/recruiters/calculator', kicker: 'Before you apply', title: 'Stipend calculator', body: 'Self-check the minimum stipend for your role.' },
  { href: '/apply', kicker: 'Start here', title: 'Apply to recruit', body: 'No login required — submit and receive a tracking token.' },
];

export default function RecruitersHubPage() {
  return (
    <PageShell>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--layout-section-y)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <p style={kicker}>For recruiters</p>
          <h1 style={h1}>Hire from NID</h1>
          <p style={lede}>
            The Industry Interface is the National Institute of Design&rsquo;s placement portal — the single front door
            for recruiting graduating design talent across the Ahmedabad, Gandhinagar, and Bengaluru R&amp;D campuses.
            Everything starts in the open; you only log in once you are verified.
          </p>

          <h2 style={h2}>Why hire from NID</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            {WHY.map((w) => (
              <div key={w.title} style={panel}>
                <h3 style={panelTitle}>{w.title}</h3>
                <p style={panelBody}>{w.body}</p>
              </div>
            ))}
          </div>

          <h2 style={h2}>Where to go next</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} style={card}>
                <p style={accentKicker}>{l.kicker}</p>
                <h3 style={cardTitle}>{l.title}</h3>
                <p style={cardBody}>{l.body}</p>
                <span style={{ ...accentKicker, marginTop: 'var(--space-3)', display: 'inline-block' }}>Open →</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const kicker = { fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const h1 = { fontSize: 'var(--fs-48)', lineHeight: 'var(--lh-56)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' };
const h2 = { fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-28)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-12)' };
const lede = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-30)', fontWeight: 'var(--fw-300)', color: 'var(--text-primary)', maxWidth: '720px' };
const panel = { backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const panelTitle = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' };
const panelBody = { fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-300)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' };
const card = { display: 'block', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: 'var(--card-shadow)', borderTop: '3px solid var(--accent)', textDecoration: 'none' } as const;
const accentKicker = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };
const cardTitle = { fontSize: 'var(--fs-18)', lineHeight: 'var(--lh-23)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const cardBody = { fontSize: 'var(--fs-14)', lineHeight: 'var(--lh-18)', fontWeight: 'var(--fw-300)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' };
