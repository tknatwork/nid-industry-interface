import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { RecruiterShell, StatusPill } from '@nid/ui';
import { listApiKeys } from '@nid/module-admin-accountability';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { CopyField } from '~/components/CopyField';

export const metadata: Metadata = {
  title: 'API & alerts · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

const WEBHOOK_EVENTS: ReadonlyArray<readonly [string, string]> = [
  ['cycle.opened', 'a new placement cycle opens'],
  ['cycle.deadline.approaching', 'a key deadline is near'],
  ['jd.published', 'your JD goes live to students'],
  ['jd.applicants.added', 'applicant count changes (counts only)'],
  ['shortlist.confirmed', 'your shortlist is confirmed'],
  ['interview.scheduled', 'an interview slot is set'],
  ['offer.status.changed', 'a student accepts / declines'],
  ['cycle.closed', 'the cycle ends'],
];

export default async function IntegrationsPage() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3100';
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  const base = `${proto}://${host}`;

  const key = listApiKeys().find((k) => k.recruiterId === DEMO_RECRUITER.recruiterId && k.status === 'active');
  const token = key?.id ?? 'key_acme_01';
  const scopes = key?.scope ?? 'cycle:current:read me:read me:history:read';

  return (
    <RecruiterShell activeNav="integrations" companyName={DEMO_RECRUITER.companyName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Wire NID into your own system</p>
            <h1 style={h1}>API &amp; alerts</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', maxWidth: '640px' }}>
              Get regular updates on the institute&rsquo;s placement cycle straight into your tools — subscribe the
              calendar feed, push events to your ATS via webhooks, or pull our read-only REST API. Read-only by
              design: posting JDs, shortlisting, and offers stay deliberate actions in this portal.
            </p>
          </header>

          {/* 1. Calendar subscription — the no-code path */}
          <Card accent="var(--ii-blue)" title="1 · Subscribe to the placement calendar" sub="No code — add one URL to Google / Outlook / Apple Calendar and every cycle date + reminder shows up automatically.">
            <a href={`webcal://${host}/api/public/cycles.ics`} style={primaryBtn}>＋ Add to your calendar</a>
            <p style={{ ...mini, marginTop: 'var(--space-3)' }}>Or copy the feed URL (iCalendar):</p>
            <CopyField value={`${base}/api/public/cycles.ics`} href={`${base}/api/public/cycles.ics`} />
            <p style={{ ...mini, marginTop: 'var(--space-3)' }}>JSON feed (for embeds / dashboards):</p>
            <CopyField value={`${base}/api/public/cycles.json`} href={`${base}/api/public/cycles.json`} />
          </Card>

          {/* 2. Webhooks — push to ATS */}
          <Card accent="var(--purple-500)" title="2 · Webhooks — push alerts to your ATS" sub="Point your endpoint at us; we POST an HMAC-SHA256-signed payload on every cycle change.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              {WEBHOOK_EVENTS.map(([ev, desc]) => (
                <span key={ev} title={desc} style={chip}><code style={{ fontFamily: 'ui-monospace, monospace' }}>{ev}</code></span>
              ))}
            </div>
            <p style={mini}>Send yourself a signed test event (uses your bearer token):</p>
            <CopyField multiline value={`curl -X POST ${base}/api/v1/recruiter/webhooks/simulate \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event":"offer.status.changed"}'`} />
            <p style={{ ...mini, marginTop: 'var(--space-3)' }}>List the event catalogue:</p>
            <CopyField value={`${base}/api/v1/recruiter/webhooks/events`} href={`${base}/api/v1/recruiter/webhooks/events`} />
          </Card>

          {/* 3. REST API */}
          <Card accent="var(--cyan-500)" title="3 · REST API (read-only)" sub="Pull your own cycle, profile, and JD data. Counts + aggregates only — never individual student PII.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={mini}>Your bearer token</span>
              <StatusPill tone="success">active</StatusPill>
              <span style={{ ...mini, color: 'var(--text-secondary)' }}>scopes: {scopes}</span>
            </div>
            <CopyField value={token} />
            <p style={{ ...mini, marginTop: 'var(--space-3)' }}>Your profile + current health band:</p>
            <CopyField multiline value={`curl -H "Authorization: Bearer ${token}" \\\n  ${base}/api/v1/recruiter/me`} />
            <p style={{ ...mini, marginTop: 'var(--space-3)' }}>Your JDs · upcoming cycles:</p>
            <CopyField value={`${base}/api/v1/recruiter/me/jds`} href={`${base}/api/v1/recruiter/me/jds`} />
            <CopyField value={`${base}/api/v1/recruiter/cycles`} href={`${base}/api/v1/recruiter/cycles`} />
            <p style={{ ...mini, marginTop: 'var(--space-3)' }}>Full contract (OpenAPI 3.1) + SDK <code>@nid/industry-recruiter-sdk</code> (Phase 2):</p>
            <CopyField value={`${base}/api/v1/openapi.json`} href={`${base}/api/v1/openapi.json`} />
          </Card>

          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-6)' }}>
            Access is revocable by the placement cell — if your company health band drops, the key returns 401 and
            your integration breaks audibly (by design). Manage rotation here when the auth module lands.
          </p>
        </div>
      </section>
    </RecruiterShell>
  );
}

function Card({ accent, title, sub, children }: { accent: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderLeft: `4px solid ${accent}`, borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', marginBottom: 'var(--space-5)' }}>
      <h2 style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{title}</h2>
      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 var(--space-4)', lineHeight: 1.5 }}>{sub}</p>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>{children}</div>
    </section>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const mini = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)' } as const;
const chip = { fontSize: 'var(--fs-12)', color: 'var(--text-strong)', backgroundColor: 'var(--surface-panel)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: '2px var(--space-2)' } as const;
const primaryBtn = { display: 'inline-block', background: 'var(--accent)', color: 'var(--accent-text)', textDecoration: 'none', borderRadius: 'var(--radius-pill)', padding: 'var(--space-2) var(--space-5)', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)' } as const;
