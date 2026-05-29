import type { Metadata } from 'next';
import { AdminShell, Button, Field, StatusPill } from '@nid/ui';
import { listOpenSlots } from '@nid/module-slot-booking';
import { publishSlotAction } from './actions';

export const metadata: Metadata = {
  title: 'Interview slots · Admin · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function AdminSlotsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  const slots = listOpenSlots('cycle_spring_2026');
  const byDay = groupByDay(slots);

  return (
    <AdminShell activeNav="slots" roleLabel="Placement head · NID Ahmedabad">
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-8)' }}>
            <p style={label}>Spring 2026 · interview calendar</p>
            <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
              Interview slots
            </h1>
            <p style={{ fontSize: 'var(--fs-16)', color: 'var(--text-primary)', marginTop: 'var(--space-3)', maxWidth: '720px' }}>
              Open the interview-day calendar. Recruiters book from these slots — they cannot create their own.
            </p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--space-8)' }}>
            <div>
              {Object.entries(byDay).map(([day, daySlots]) => (
                <div key={day} style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 style={label}>{formatDay(day)}</h2>
                  <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {daySlots.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: 'var(--surface-card)',
                          border: '1px solid var(--card-border)',
                          borderRadius: 'var(--radius-2)',
                          padding: 'var(--space-3) var(--space-4)',
                        }}
                      >
                        <span style={{ fontSize: 'var(--fs-16)', color: 'var(--text-strong)', fontWeight: 'var(--fw-500)' }}>
                          {s.startTime}–{s.endTime}
                        </span>
                        <StatusPill tone={s.booked >= s.capacity ? 'warning' : 'success'}>
                          {s.booked}/{s.capacity} booked
                        </StatusPill>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <aside>
              <form
                action={publishSlotAction}
                style={{
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--card-radius)',
                  padding: 'var(--card-padding)',
                  display: 'grid',
                  gap: 'var(--space-3)',
                  position: 'sticky',
                  top: 'var(--space-6)',
                }}
              >
                <h2 style={label}>Publish a slot</h2>
                {error && <p role="alert" style={{ fontSize: 'var(--fs-12)', color: 'var(--input-error-text)', fontWeight: 'var(--fw-600)' }}>{decodeURIComponent(error)}</p>}
                <Field id="day" name="day" label="Day" type="date" defaultValue="2026-06-03" required />
                <Field id="startTime" name="startTime" label="Start (HH:MM)" placeholder="10:00" defaultValue="10:00" required />
                <Field id="endTime" name="endTime" label="End (HH:MM)" placeholder="12:00" defaultValue="12:00" required />
                <Field id="capacity" name="capacity" label="Capacity" type="number" min={1} defaultValue={4} required />
                <Button type="submit" size="sm">Publish slot</Button>
              </form>
            </aside>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function groupByDay<T extends { day: string }>(items: readonly T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const it of items) (out[it.day] ??= []).push(it);
  return out;
}
function formatDay(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: '2-digit', month: 'long' });
}
const label = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
};
