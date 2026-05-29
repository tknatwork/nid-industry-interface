import type { Metadata } from 'next';
import { AdminShell, Button, StatusPill } from '@nid/ui';

export const metadata: Metadata = {
  title: 'Content · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

interface ContentBlock {
  readonly key: string;
  readonly title: string;
  readonly replaces: string;
}

const BLOCKS: readonly ContentBlock[] = [
  {
    key: 'guidelines',
    title: 'Guidelines accordion',
    replaces: 'Today: a single long static HTML page recruiters scroll past. Becomes structured, searchable accordion sections the cell edits without touching markup.',
  },
  {
    key: 'faq',
    title: 'FAQ',
    replaces: 'Today: hand-maintained Q&A in page HTML. Becomes individually editable entries with publish/unpublish per question.',
  },
  {
    key: 'process',
    title: '8-step process',
    replaces: 'Today: an image/scanned diagram of the recruiter journey. Becomes editable step cards the cell reorders and re-words per cycle.',
  },
  {
    key: 'footer',
    title: 'Footer blocks',
    replaces: 'Today: repeated static footer HTML across pages. Becomes shared content blocks edited once and reflected everywhere.',
  },
  {
    key: 'login-errors',
    title: 'Login error catalogue',
    replaces: 'Today: cryptic ASP.NET error strings. Becomes a catalogue of human-readable messages the cell can clarify without a deploy.',
  },
  {
    key: 'legal',
    title: 'Legal pages',
    replaces: 'Today: scanned PDFs of terms, privacy, and the participation agreement. Becomes accessible, versioned text the cell maintains in-portal.',
  },
];

export default function ContentPage() {
  return (
    <AdminShell activeNav="content" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={labelS}>Content management</p>
            <h1 style={h1}>Site content</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              The legacy portal baked recruiter-facing copy into static HTML and scanned PDFs — every change meant a
              developer and a redeploy. These blocks move that copy into editable content the placement cell owns. Editing
              is mocked for this prototype.
            </p>
          </header>

          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
            <StatusPill tone="info">demo · display only</StatusPill>
          </p>

          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {BLOCKS.map((b) => (
              <div key={b.key} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{b.title}</p>
                    <p style={{ fontSize: 'var(--fs-13)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>{b.replaces}</p>
                  </div>
                  <Button variant="secondary" size="sm" disabled>Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

const labelS = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
