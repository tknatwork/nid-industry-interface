import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecruiterShell, Button, StatusPill } from '@nid/ui';
import { getJd } from '@nid/module-jd-posting';
import {
  buildInterviewDayView,
  getTransportMode,
  type QueueEntry,
  type TransportMode,
} from '@nid/module-interview-console';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { setTransportAction } from './actions';

export const metadata: Metadata = {
  title: 'Interview day · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

const TRANSPORTS: ReadonlyArray<{ key: TransportMode; label: string; hint: string }> = [
  { key: 'live', label: 'Live push', hint: 'SSE · instant · best on stable Wi-Fi' },
  { key: 'periodic', label: 'Periodic 15s', hint: 'lower battery · better on flaky Wi-Fi' },
  { key: 'manual', label: 'Manual', hint: 'pull-to-refresh · offline-friendly' },
];

export default async function InterviewConsole({ params }: { params: Promise<{ jdId: string }> }) {
  const { jdId } = await params;
  const jd = getJd(jdId);
  if (!jd) notFound();

  const view = buildInterviewDayView(jdId);
  const transport = getTransportMode(DEMO_RECRUITER.recruiterId);

  return (
    <RecruiterShell activeNav="interviews" companyName={DEMO_RECRUITER.companyName}>
      {/* Mobile-first: constrained single column, the canonical phone surface. */}
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-8)' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <a href={`/recruiter/jds/${jdId}/slots`} style={backLink}>← Slots</a>

          {view.isDemo && (
            <div
              style={{
                backgroundColor: 'var(--amber-500)',
                color: 'var(--grey-900)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-2)',
                fontSize: 'var(--fs-12)',
                fontWeight: 'var(--fw-600)',
                textAlign: 'center',
                marginBottom: 'var(--space-4)',
              }}
            >
              DEMO MODE · sample data · no real candidates affected · book slots to see live interviews
            </div>
          )}

          <header style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={label}>{jd.title}</p>
              <h1 style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>Interview day</h1>
            </div>
            {view.runningLateMinutes > 0 && <StatusPill tone="warning">Running {view.runningLateMinutes} min late</StatusPill>}
          </header>

          {/* Now interviewing */}
          {view.nowInterviewing ? (
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '2px solid var(--accent)',
                borderRadius: 'var(--card-radius)',
                padding: 'var(--card-padding)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <p style={label}>Now interviewing</p>
              <p style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' }}>
                {view.nowInterviewing.studentName}
              </p>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
                {view.nowInterviewing.disciplineName} · {view.nowInterviewing.round} · {view.nowInterviewing.scheduledTime}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
                <Button size="sm">Advance</Button>
                <Button size="sm" variant="secondary">Hold</Button>
                <Button size="sm" variant="ghost">Reject</Button>
              </div>
            </div>
          ) : (
            <p style={notice}>No candidate currently in interview.</p>
          )}

          {/* Up next */}
          <p style={{ ...label, marginBottom: 'var(--space-2)' }}>Up next</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
            {view.upNext.length === 0 && <p style={notice}>Queue empty.</p>}
            {view.upNext.map((q) => (
              <QueueRow key={q.studentId} entry={q} />
            ))}
          </div>

          {/* Day-of actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
            <Button variant="secondary" size="sm">⚠ Flag delay to coordinator</Button>
            <Button variant="secondary" size="sm">💬 Ping coordinator</Button>
            <Button variant="ghost" size="sm">🚨 Raise issue</Button>
            <Button variant="ghost" size="sm">↻ Refresh</Button>
          </div>

          {/* Transport settings */}
          <div
            style={{
              backgroundColor: 'var(--surface-panel)',
              borderRadius: 'var(--card-radius)',
              padding: 'var(--card-padding)',
            }}
          >
            <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Update mode</p>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {TRANSPORTS.map((t) => (
                <form key={t.key} action={setTransportAction}>
                  <input type="hidden" name="jdId" value={jdId} />
                  <input type="hidden" name="mode" value={t.key} />
                  <button
                    type="submit"
                    aria-pressed={transport === t.key}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-2)',
                      border: `1px solid ${transport === t.key ? 'var(--accent)' : 'var(--border-default)'}`,
                      backgroundColor: transport === t.key ? 'color-mix(in oklch, var(--accent), white 85%)' : 'var(--surface-card)',
                      cursor: 'pointer',
                    }}
                  >
                    <span>
                      <span style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{t.label}</span>
                      <span style={{ display: 'block', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>{t.hint}</span>
                    </span>
                    {transport === t.key && <StatusPill tone="success">Active</StatusPill>}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      </section>
    </RecruiterShell>
  );
}

function QueueRow({ entry }: { entry: QueueEntry }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-3)',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-2)',
        padding: 'var(--space-3) var(--space-4)',
      }}
    >
      <div>
        <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{entry.studentName}</p>
        <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
          {entry.scheduledTime} · {entry.round}
        </p>
      </div>
      {entry.conflict.inAnotherInterview ? (
        <StatusPill tone="warning">in another interview · ETA {entry.conflict.etaBack}</StatusPill>
      ) : (
        <StatusPill tone="success">free</StatusPill>
      )}
    </div>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const backLink = { ...label, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
