import type { Metadata } from 'next';
import { AdminShell, Button, Field, StatusPill } from '@nid/ui';
import { listContentBlocks } from '@nid/module-admin-cms';
import { updateContentBlockAction } from './actions';

export const metadata: Metadata = {
  title: 'Content · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const sp = await searchParams;
  const blocks = listContentBlocks();

  return (
    <AdminShell activeNav="content" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={labelS}>Content management</p>
            <h1 style={h1}>Site content</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              The legacy portal baked recruiter-facing copy into static HTML + scanned PDFs — every change meant a
              developer and a redeploy. These blocks are editable in-portal and the edits persist.
            </p>
          </header>

          {sp.saved && <p style={savedBanner}>Saved &ldquo;{decodeURIComponent(sp.saved)}&rdquo;.</p>}
          {sp.error && <p role="alert" style={banner}>{decodeURIComponent(sp.error)}</p>}

          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {blocks.map((b) => (
              <form key={b.slot} action={updateContentBlockAction} style={card}>
                <input type="hidden" name="slot" value={b.slot} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <p style={labelS}>{b.slot}</p>
                  {b.updatedAt && <StatusPill tone="neutral">edited {new Date(b.updatedAt).toLocaleDateString('en-IN')}</StatusPill>}
                </div>
                <Field id={`title-${b.slot}`} name="title" label="Title" defaultValue={b.title} required />
                <label style={{ display: 'block', marginTop: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Body</span>
                  <textarea name="body" rows={3} defaultValue={b.body} required style={textarea} />
                </label>
                <div style={{ marginTop: 'var(--space-3)' }}><Button type="submit" size="sm">Save block</Button></div>
              </form>
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
const textarea = { width: '100%', marginTop: 'var(--space-1)', fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', fontFamily: 'inherit', resize: 'vertical' as const, lineHeight: 1.5 };
const banner = { marginBottom: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const savedBanner = { marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', backgroundColor: 'color-mix(in oklch, var(--green-500), white 85%)', color: 'var(--text-strong)', borderRadius: 'var(--radius-2)', fontWeight: 'var(--fw-600)', fontSize: 'var(--fs-14)' } as const;
