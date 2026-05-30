import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell, Button, StatusPill, type StatusTone } from '@nid/ui';
import { requireOwnedJd } from '~/lib/recruiter-jd-guard';
import { listShortlist } from '@nid/module-candidate-browse';
import { listOffers } from '@nid/module-offer-cascade';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { closeJdAction, withdrawJdAction } from './actions';

export const metadata: Metadata = {
  title: 'Close JD · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

const WITHDRAW_CATEGORIES = [
  { value: 'force-majeure', label: 'Force majeure / Act of God' },
  { value: 'material-business-change', label: 'Material business change (layoff, role frozen)' },
  { value: 'other', label: 'Other' },
];

export default async function CloseJdPage({
  params,
  searchParams,
}: {
  params: Promise<{ jdId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { jdId } = await params;
  const jd = await requireOwnedJd(jdId);
  const recruiter = await readRecruiterSession();
  const error = (await searchParams).error;

  const shortlist = listShortlist(jdId);
  const accepted = listOffers(jdId).filter((o) => o.status === 'accepted');
  const acceptedIds = new Set(accepted.map((o) => o.studentId));
  const notSelected = shortlist.filter((s) => !acceptedIds.has(s.candidate.studentId));

  const isPublished = jd.status === 'published';

  return (
    <RecruiterShell activeNav="offers" companyName={recruiter.companyName} accountMenu={<RecruiterAccountMenu companyName={recruiter.companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <a href={`/recruiter/jds/${jdId}/offers`} style={backLink}>← Offers</a>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div>
              <p style={label}>{jd.title}</p>
              <h1 style={h1}>Close this JD</h1>
            </div>
            <StatusPill tone={statusTone(jd.status)}>{jd.status}</StatusPill>
          </header>

          {error && <p role="alert" style={banner}>{decodeURIComponent(error)}</p>}

          {!isPublished ? (
            <div style={card}>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
                This JD is <strong>{jd.status}</strong>.
                {jd.closeMessageMd && (
                  <>
                    <br /><br />Closure message sent to not-selected students:<br />
                    <span style={{ color: 'var(--text-secondary)' }}>&ldquo;{jd.closeMessageMd}&rdquo;</span>
                  </>
                )}
                {jd.withdrawnReason && (
                  <>
                    <br /><br />Withdrawn ({jd.withdrawnCategory}): <span style={{ color: 'var(--text-secondary)' }}>{jd.withdrawnReason}</span>
                  </>
                )}
              </p>
            </div>
          ) : (
            <>
              <form action={closeJdAction} style={card}>
                <input type="hidden" name="jdId" value={jdId} />
                <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)', marginBottom: 'var(--space-3)' }}>
                  Selected: <strong>{accepted.length}</strong> · Not selected: <strong>{notSelected.length}</strong>
                </p>
                <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
                  Required: a collective message for the not-selected students. NID holds recruiters to a respectful,
                  specific closure note — explain the selection rationale without singling anyone out.
                </p>
                <textarea
                  name="collectiveMessage"
                  required
                  rows={4}
                  style={textarea}
                  defaultValue="We prioritised candidates whose portfolios centred on systems-level product work. Thank you for the time and care you put into your application."
                />
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Button type="submit">Send closure note &amp; close JD</Button>
                </div>
              </form>

              <form action={withdrawJdAction} style={{ ...card, marginTop: 'var(--space-6)', borderColor: 'var(--pill-danger-fg, #b00)' }}>
                <input type="hidden" name="jdId" value={jdId} />
                <h2 style={{ ...label, marginBottom: 'var(--space-2)' }}>Or withdraw the JD (commitment break)</h2>
                <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
                  Withdrawing a published JD is treated as a commitment break and carries a health-score signal
                  unless you establish force majeure. Fees are non-refundable.
                </p>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                  <span style={fieldLabel}>Reason category</span>
                  <select name="category" required style={input} defaultValue="">
                    <option value="" disabled>Select…</option>
                    {WITHDRAW_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                  <span style={fieldLabel}>Detail (required)</span>
                  <input name="reason" required placeholder="What happened?" style={input} />
                </label>
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Button type="submit" variant="ghost" size="sm">Withdraw JD</Button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

function statusTone(s: string): StatusTone {
  return s === 'published' ? 'success' : s === 'closed' ? 'neutral' : s === 'withdrawn' ? 'danger' : 'warning';
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const backLink = { ...label, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const banner = { marginBottom: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const fieldLabel = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' } as const;
const input = { width: '100%', marginTop: 'var(--space-1)', fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', fontFamily: 'inherit' } as const;
const textarea = { ...input, resize: 'vertical' as const };
