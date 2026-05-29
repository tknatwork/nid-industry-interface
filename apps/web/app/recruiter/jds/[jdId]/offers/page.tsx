import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecruiterShell, Button, StatusPill, type StatusTone } from '@nid/ui';
import { getJd } from '@nid/module-jd-posting';
import { getCandidate } from '@nid/module-candidate-browse';
import { getInterviewsComplete, listSelected } from '@nid/module-interview-console';
import { listOffers, cascadeFor, tallyFor, type OfferRecord } from '@nid/module-offer-cascade';
import { DEMO_RECRUITER } from '~/lib/demo-recruiter';
import { issueOfferAction, respondAction } from './actions';

export const metadata: Metadata = {
  title: 'Offers · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function OffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ jdId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { jdId } = await params;
  const jd = getJd(jdId);
  if (!jd) notFound();
  const error = (await searchParams).error;

  // The Offers cascade is gated on the Interview tab's "Done & Dusted" flag
  // (plan §S). Until interviews are marked complete, this page shows only a
  // limited subset — no issue-offer / cascade controls.
  const interviewsComplete = getInterviewsComplete(jdId);

  // The offer pool is the candidates the recruiter SELECTED in the After phase,
  // in selection order — not the raw shortlist (plan §S "issue offers to the
  // selected candidates, ordered from the After phase").
  const selected = listSelected(jdId);
  const selectedCandidates = selected
    .map((p) => {
      const c = getCandidate(p.studentId);
      return c ? { studentId: p.studentId, name: c.name, disciplineName: c.disciplineName } : null;
    })
    .filter((x): x is { studentId: string; name: string; disciplineName: string } => x !== null);

  const offers = listOffers(jdId);
  const offeredStudentIds = new Set(offers.map((o) => o.studentId));
  const declinedIds = new Set(offers.filter((o) => o.status === 'declined').map((o) => o.studentId));

  // Selected candidates who don't yet hold an offer — the next-wave pool.
  const offerablePool = selectedCandidates.filter((s) => !offeredStudentIds.has(s.studentId));
  const selectedRemaining = offerablePool.length;

  const tally = tallyFor(jdId, jd.positions);
  const nameByStudent = new Map(selectedCandidates.map((s) => [s.studentId, s.name]));

  return (
    <RecruiterShell activeNav="offers" companyName={DEMO_RECRUITER.companyName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <a href={`/recruiter/jds/${jdId}/interviews`} style={backLink}>← Interview day</a>
          <header style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <p style={label}>{jd.title} · offers</p>
              <h1 style={{ fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                Offers
              </h1>
            </div>
            <a href={`/recruiter/jds/${jdId}/close`} style={{ ...label, color: 'var(--accent)', textDecoration: 'none' }}>
              Close / withdraw this JD →
            </a>
          </header>

          {error && <p role="alert" style={errorBanner}>{decodeURIComponent(error)}</p>}

          {/* Tally — always visible, both before and after unlock. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <Stat label="Open positions" value={tally.positions} />
            <Stat label="Selected" value={selectedCandidates.length} />
            {interviewsComplete && <Stat label="Accepted" value={tally.accepted} />}
            {interviewsComplete && <Stat label="Outstanding" value={tally.outstanding} />}
            {interviewsComplete && <Stat label="Declined" value={tally.declined} />}
            <Stat label="Filled" value={`${tally.filled} / ${tally.positions}`} />
          </div>

          {interviewsComplete ? (
            <UnlockedOffers
              jdId={jdId}
              positions={jd.positions}
              selectedRemaining={selectedRemaining}
              offers={offers}
              offerablePool={offerablePool}
              declinedIds={declinedIds}
              nameByStudent={nameByStudent}
              {...(jd.baseMinPaise !== undefined ? { ctcPaise: jd.baseMinPaise } : {})}
              {...(jd.stipendPaise !== undefined ? { stipendPaise: jd.stipendPaise } : {})}
            />
          ) : (
            <LockedNotice jdId={jdId} selectedCount={selectedCandidates.length} />
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

/** Pre-complete: limited subset + the locked message (plan §S "before complete"). */
function LockedNotice({ jdId, selectedCount }: { jdId: string; selectedCount: number }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-panel)',
        border: '1px dashed var(--border-emphasized)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--space-8)',
        textAlign: 'center',
        display: 'grid',
        gap: 'var(--space-3)',
        justifyItems: 'center',
      }}
    >
      <StatusPill tone="neutral">Offers locked</StatusPill>
      <p style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>
        Offers unlock once interviews are marked complete
      </p>
      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', maxWidth: '46ch' }}>
        Finish recording round outcomes and confirm your selected candidates on the Interview tab. The
        “Done &amp; Dusted” confirmation there opens the offer cascade — you’ll then float offers to your{' '}
        {selectedCount === 0 ? 'selected candidates' : `${selectedCount} selected candidate${selectedCount === 1 ? '' : 's'}`}, in order.
      </p>
      <a href={`/recruiter/jds/${jdId}/interviews`} style={{ textDecoration: 'none' }}>
        <Button size="sm">Go to the Interview tab →</Button>
      </a>
    </div>
  );
}

/** Post-complete: the full cascade (plan §S "after complete" + 3-wave cap). */
function UnlockedOffers({
  jdId,
  positions,
  selectedRemaining,
  offers,
  offerablePool,
  declinedIds,
  nameByStudent,
  ctcPaise,
  stipendPaise,
}: {
  jdId: string;
  positions: number;
  selectedRemaining: number;
  offers: readonly OfferRecord[];
  offerablePool: readonly { studentId: string; name: string; disciplineName: string }[];
  declinedIds: ReadonlySet<string>;
  nameByStudent: ReadonlyMap<string, string>;
  ctcPaise?: number;
  stipendPaise?: number;
}) {
  const cascade = cascadeFor(jdId, positions, selectedRemaining);

  return (
    <>
      {/* Cascade status — surfaces the wave cap (Wave X of 3 / waves exhausted), §S. */}
      <div
        style={{
          backgroundColor: cascade.canFloatNextWave
            ? 'color-mix(in oklch, var(--green-500), white 85%)'
            : cascade.wavesExhausted
              ? 'var(--pill-warning-bg)'
              : 'var(--surface-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--card-radius)',
          padding: 'var(--card-padding)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
          <StatusPill tone={cascade.wavesExhausted ? 'warning' : 'info'}>
            Wave {Math.min(cascade.currentWave + (cascade.canFloatNextWave ? 1 : 0), cascade.maxWaves) || 1} of {cascade.maxWaves}
          </StatusPill>
          {cascade.currentWave > 0 && (
            <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
              {cascade.currentWave} wave{cascade.currentWave === 1 ? '' : 's'} floated so far
            </span>
          )}
        </div>
        {cascade.canFloatNextWave ? (
          <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
            <strong>{cascade.availableSlots}</strong> position{cascade.availableSlots === 1 ? '' : 's'} open ·
            you can float wave <strong>{cascade.nextWave}</strong> to up to <strong>{cascade.nextWaveSize}</strong>{' '}
            more selected candidate{cascade.nextWaveSize === 1 ? '' : 's'} below.
          </p>
        ) : (
          <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
            {cascade.reasonIfBlocked ?? 'No further offers can be floated right now.'}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-8)' }}>
        {/* Issued offers */}
        <div>
          <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Issued offers</p>
          {offers.length === 0 ? (
            <p style={notice}>No offers issued yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {offers.map((o) => (
                <OfferRow key={o.id} offer={o} jdId={jdId} name={nameByStudent.get(o.studentId) ?? o.studentId} />
              ))}
            </div>
          )}
        </div>

        {/* Selected pool — not yet offered */}
        <div>
          <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Selected — not yet offered</p>
          {offerablePool.length === 0 ? (
            <p style={notice}>
              {nameByStudent.size === 0 ? (
                <>
                  No selected candidates.{' '}
                  <a href={`/recruiter/jds/${jdId}/interviews`} style={{ color: 'var(--accent)' }}>
                    Select candidates on the Interview tab.
                  </a>
                </>
              ) : (
                'Everyone selected has an offer.'
              )}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {offerablePool.map((candidate) => (
                <form
                  key={candidate.studentId}
                  action={issueOfferAction}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)' }}
                >
                  <input type="hidden" name="jdId" value={jdId} />
                  <input type="hidden" name="studentId" value={candidate.studentId} />
                  <input type="hidden" name="positions" value={positions} />
                  <input type="hidden" name="shortlistRemaining" value={selectedRemaining} />
                  {ctcPaise !== undefined && <input type="hidden" name="ctcPaise" value={ctcPaise} />}
                  {stipendPaise !== undefined && <input type="hidden" name="stipendPaise" value={stipendPaise} />}
                  <div>
                    <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{candidate.name}</p>
                    {declinedIds.has(candidate.studentId) && <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>previously declined</p>}
                  </div>
                  <Button type="submit" size="sm" disabled={!cascade.canFloatNextWave}>
                    Issue offer
                  </Button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function OfferRow({ offer, jdId, name }: { offer: OfferRecord; jdId: string; name: string }) {
  return (
    <div style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div>
          <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{name}</p>
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Wave {offer.wave}</p>
        </div>
        <StatusPill tone={offerTone(offer.status)}>{offer.status}</StatusPill>
      </div>
      {offer.status === 'pending' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <form action={respondAction}>
            <input type="hidden" name="jdId" value={jdId} />
            <input type="hidden" name="studentId" value={offer.studentId} />
            <input type="hidden" name="status" value="accepted" />
            <Button type="submit" size="sm">Accept (demo)</Button>
          </form>
          <form action={respondAction}>
            <input type="hidden" name="jdId" value={jdId} />
            <input type="hidden" name="studentId" value={offer.studentId} />
            <input type="hidden" name="status" value="declined" />
            <Button type="submit" size="sm" variant="ghost">Decline (demo)</Button>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ label: l, value }: { label: string; value: string | number }) {
  return (
    <div style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)' }}>
      <p style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', lineHeight: 1 }}>{value}</p>
      <p style={{ ...label, marginTop: 'var(--space-1)' }}>{l}</p>
    </div>
  );
}

function offerTone(status: OfferRecord['status']): StatusTone {
  switch (status) {
    case 'accepted':
      return 'success';
    case 'pending':
      return 'info';
    case 'declined':
      return 'danger';
    case 'expired':
      return 'neutral';
  }
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const backLink = { ...label, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' };
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
const errorBanner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
