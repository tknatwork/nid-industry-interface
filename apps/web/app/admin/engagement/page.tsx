import type { Metadata } from 'next';
import { AdminShell, Button, Field, StatusPill } from '@nid/ui';
import { listPptWindows, listMeetingSlots, type PptWindow, type MeetingSlot } from '@nid/module-recruiter-engagement';
import { publishPptWindowAction, publishMeetingSlotAction } from './actions';

export const metadata: Metadata = {
  title: 'PPT & meetings · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function AdminEngagementPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  const windows = listPptWindows('cycle_spring_2026');
  const slots = listMeetingSlots();

  return (
    <AdminShell activeNav="engagement" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Spring 2026 · the supply recruiters book</p>
            <h1 style={h1}>PPT windows &amp; meeting slots</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Admin opens the windows; recruiters book them at <code>/recruiter/ppt</code> and{' '}
              <code>/recruiter/meetings</code> (and bring their own meeting link — no platform integration).
            </p>
          </header>

          {error && <p role="alert" style={banner}>{decodeURIComponent(error)}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-8)' }}>
            {/* PPT windows */}
            <div>
              <p style={{ ...label, marginBottom: 'var(--space-3)' }}>PPT windows ({windows.length})</p>
              <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {windows.map((w: PptWindow) => (
                  <div key={w.id} style={row}>
                    <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>{fmtDay(w.day)} · {w.startTime}–{w.endTime} · {w.campus} · {w.mode}</span>
                    <StatusPill tone={w.status === 'open' ? 'success' : 'neutral'}>{w.status}</StatusPill>
                  </div>
                ))}
              </div>
              <form action={publishPptWindowAction} style={card}>
                <h2 style={{ ...label, marginBottom: 'var(--space-2)' }}>Open a PPT window</h2>
                <input type="hidden" name="cycleId" value="cycle_spring_2026" />
                <Field id="ppt-day" name="day" label="Day" type="date" defaultValue="2026-05-29" required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <Field id="ppt-start" name="startTime" label="Start" placeholder="11:00" defaultValue="11:00" required />
                  <Field id="ppt-end" name="endTime" label="End" placeholder="12:00" defaultValue="12:00" required />
                </div>
                <label style={{ display: 'block', marginTop: 'var(--space-2)' }}>
                  <span style={fieldLabel}>Mode</span>
                  <select name="mode" defaultValue="virtual" style={input}>
                    <option value="virtual">virtual</option>
                    <option value="on-campus">on-campus</option>
                  </select>
                </label>
                <Field id="ppt-campus" name="campus" label="Campus" placeholder="Ahmedabad" defaultValue="Ahmedabad" required />
                <div style={{ marginTop: 'var(--space-3)' }}><Button type="submit" size="sm">Open window</Button></div>
              </form>
            </div>

            {/* Meeting slots */}
            <div>
              <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Placement-head meeting slots ({slots.length})</p>
              <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {slots.map((s: MeetingSlot) => (
                  <div key={s.id} style={row}>
                    <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>{s.placementHead} · {fmtDay(s.day)} {s.time} · {s.campus}</span>
                    <StatusPill tone={s.status === 'open' ? 'success' : 'neutral'}>{s.status}</StatusPill>
                  </div>
                ))}
              </div>
              <form action={publishMeetingSlotAction} style={card}>
                <h2 style={{ ...label, marginBottom: 'var(--space-2)' }}>Open a meeting slot</h2>
                <Field id="mtg-head" name="placementHead" label="Placement head" defaultValue="Sujitha Nair" required />
                <Field id="mtg-campus" name="campus" label="Campus" defaultValue="Ahmedabad" required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <Field id="mtg-day" name="day" label="Day" type="date" defaultValue="2026-05-29" required />
                  <Field id="mtg-time" name="time" label="Time" placeholder="14:00" defaultValue="14:00" required />
                </div>
                <div style={{ marginTop: 'var(--space-3)' }}><Button type="submit" size="sm">Open slot</Button></div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function fmtDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', display: 'grid', gap: 'var(--space-2)' } as const;
const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-2) var(--space-3)' } as const;
const banner = { marginBottom: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const fieldLabel = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' } as const;
const input = { width: '100%', marginTop: 'var(--space-1)', fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', fontFamily: 'inherit' } as const;
