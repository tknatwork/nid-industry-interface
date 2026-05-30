import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell, Button, StatusPill } from '@nid/ui';
import { listPptWindows, listPptBookings, type PptWindow } from '@nid/module-recruiter-engagement';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { bookPptAction } from './actions';

export const metadata: Metadata = {
  title: 'Pre-Placement Talks · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function PptPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { recruiterId, cycleId, companyName } = DEMO_RECRUITER;
  const error = (await searchParams).error;
  const windows = listPptWindows(cycleId);
  const bookings = listPptBookings(recruiterId);
  const bookedWindowIds = new Set(bookings.map((b) => b.windowId));
  const open = windows.filter((w) => w.status === 'open' && !bookedWindowIds.has(w.id));

  return (
    <RecruiterShell companyName={companyName} accountMenu={<RecruiterAccountMenu companyName={companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>First-class artifact</p>
            <h1 style={h1}>Pre-Placement Talks</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Book an admin-published window, paste your own deck + meeting link, and set the agenda. Eligible
              students and coordinators are notified on confirmation.
            </p>
          </header>

          {error && <p role="alert" style={banner}>{decodeURIComponent(error)}</p>}

          {bookings.length > 0 && (
            <>
              <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Your booked PPTs</p>
              <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
                {bookings.map((b) => {
                  const w = windows.find((x) => x.id === b.windowId);
                  return (
                    <div key={b.id} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                        <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{w ? slotText(w) : b.windowId}</p>
                        <StatusPill tone="success">booked</StatusPill>
                      </div>
                      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>Deck: {b.deckUrl}</p>
                      <ul style={agendaList}>{b.agenda.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Open windows</p>
          {open.length === 0 ? (
            <p style={notice}>No open PPT windows right now.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {open.map((w) => (
                <form key={w.id} action={bookPptAction} style={card}>
                  <input type="hidden" name="windowId" value={w.id} />
                  <input type="hidden" name="recruiterId" value={recruiterId} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{slotText(w)}</p>
                    <StatusPill tone="info">{w.mode}</StatusPill>
                  </div>
                  <label style={fieldWrap}><span style={fieldLabel}>Deck link (HTML or PDF/A)</span>
                    <input name="deckUrl" required placeholder="https://…" style={input} /></label>
                  <label style={fieldWrap}><span style={fieldLabel}>Meeting link (you bring your own)</span>
                    <input name="meetingLinkUrl" placeholder="https://… (Zoom / Meet / Webex)" style={input} /></label>
                  <label style={fieldWrap}><span style={fieldLabel}>Agenda — one point per line</span>
                    <textarea name="agenda" required rows={3} style={textarea} defaultValue={"Company overview\nRoles + growth path\nPosting locations\nQ&A"} /></label>
                  <div style={{ marginTop: 'var(--space-2)' }}><Button type="submit" size="sm">Book this window</Button></div>
                </form>
              ))}
            </div>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

function slotText(w: PptWindow): string {
  const d = new Date(`${w.day}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${d} · ${w.startTime}–${w.endTime} · ${w.campus}`;
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)' } as const;
const banner = { marginBottom: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const fieldWrap = { display: 'block', marginBottom: 'var(--space-2)' } as const;
const fieldLabel = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' } as const;
const input = { width: '100%', marginTop: 'var(--space-1)', fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', fontFamily: 'inherit' } as const;
const textarea = { ...input, resize: 'vertical' as const };
const agendaList = { margin: 'var(--space-2) 0 0', paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-14)', color: 'var(--text-strong)' } as const;
