import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell, Button, StatusPill } from '@nid/ui';
import {
  listMeetingSlots,
  listMeetings,
  DEFAULT_MEETING_AGENDA,
  type MeetingSlot,
} from '@nid/module-recruiter-engagement';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { bookMeetingAction } from './actions';

export const metadata: Metadata = {
  title: 'Meetings · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function MeetingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { recruiterId, companyName } = DEMO_RECRUITER;
  const error = (await searchParams).error;
  const slots = listMeetingSlots();
  const meetings = listMeetings(recruiterId);
  const bookedSlotIds = new Set(meetings.map((m) => m.slotId));
  const open = slots.filter((s) => s.status === 'open' && !bookedSlotIds.has(s.id));

  return (
    <RecruiterShell companyName={companyName} accountMenu={<RecruiterAccountMenu companyName={companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>One human contact per campus</p>
            <h1 style={h1}>Meet your placement head</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Pick an open slot. A structured agenda template is pre-attached so nothing is forgotten mid-call —
              add your own items below.
            </p>
          </header>

          {error && <p role="alert" style={banner}>{decodeURIComponent(error)}</p>}

          {meetings.length > 0 && (
            <>
              <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Scheduled</p>
              <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
                {meetings.map((m) => {
                  const s = slots.find((x) => x.id === m.slotId);
                  return (
                    <div key={m.id} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                        <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{s ? slotText(s) : m.slotId}</p>
                        <StatusPill tone="success">scheduled</StatusPill>
                      </div>
                      <ul style={agendaList}>{m.agenda.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Open slots</p>
          {open.length === 0 ? (
            <p style={notice}>No open slots right now.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {open.map((s) => (
                <form key={s.id} action={bookMeetingAction} style={card}>
                  <input type="hidden" name="slotId" value={s.id} />
                  <input type="hidden" name="recruiterId" value={recruiterId} />
                  <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginBottom: 'var(--space-3)' }}>{slotText(s)}</p>
                  <label style={fieldWrap}><span style={fieldLabel}>Agenda — pre-filled template, one point per line</span>
                    <textarea name="agenda" required rows={5} style={textarea} defaultValue={DEFAULT_MEETING_AGENDA.join('\n')} /></label>
                  <label style={fieldWrap}><span style={fieldLabel}>Note (optional)</span>
                    <input name="note" placeholder="Anything specific to raise" style={input} /></label>
                  <div style={{ marginTop: 'var(--space-2)' }}><Button type="submit" size="sm">Schedule</Button></div>
                </form>
              ))}
            </div>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

function slotText(s: MeetingSlot): string {
  const d = new Date(`${s.day}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${s.placementHead} · ${d} ${s.time} · ${s.campus}`;
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
