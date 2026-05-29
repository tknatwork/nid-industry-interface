import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecruiterShell, Button, StatusPill, type StatusTone } from '@nid/ui';
import { getJd } from '@nid/module-jd-posting';
import { listShortlist } from '@nid/module-candidate-browse';
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

  const shortlist = listShortlist(jdId);
  const offers = listOffers(jdId);
  const offeredStudentIds = new Set(offers.map((o) => o.studentId));
  const declinedIds = new Set(offers.filter((o) => o.status === 'declined').map((o) => o.studentId));

  // Candidates still eligible to receive an offer: shortlisted, not already offered.
  const offerableShortlist = shortlist.filter((s) => !offeredStudentIds.has(s.candidate.studentId));
  const shortlistRemaining = offerableShortlist.length;

  const tally = tallyFor(jdId, jd.positions);
  const cascade = cascadeFor(jdId, jd.positions, shortlistRemaining);

  const nameByStudent = new Map(shortlist.map((s) => [s.candidate.studentId, s.candidate.name]));

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

          {/* Tally */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <Stat label="Open positions" value={tally.positions} />
            <Stat label="Accepted" value={tally.accepted} />
            <Stat label="Outstanding" value={tally.outstanding} />
            <Stat label="Declined" value={tally.declined} />
            <Stat label="Filled" value={`${tally.filled} / ${tally.positions}`} />
          </div>

          {/* Cascade status */}
          <div
            style={{
              backgroundColor: cascade.canFloatNextWave ? 'color-mix(in oklch, var(--green-500), white 85%)' : 'var(--surface-panel)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--card-radius)',
              padding: 'var(--card-padding)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {cascade.canFloatNextWave ? (
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
                <strong>{cascade.availableSlots}</strong> position{cascade.availableSlots === 1 ? '' : 's'} open ·
                you can float offers to up to <strong>{cascade.nextWaveSize}</strong> more shortlisted candidate
                {cascade.nextWaveSize === 1 ? '' : 's'} below.
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

            {/* Offerable shortlist */}
            <div>
              <p style={{ ...label, marginBottom: 'var(--space-3)' }}>Shortlist — not yet offered</p>
              {offerableShortlist.length === 0 ? (
                <p style={notice}>
                  {shortlist.length === 0 ? (
                    <>No shortlisted candidates. <a href={`/recruiter/jds/${jdId}/applicants`} style={{ color: 'var(--accent)' }}>Shortlist first.</a></>
                  ) : (
                    'Everyone shortlisted has an offer.'
                  )}
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  {offerableShortlist.map(({ candidate }) => (
                    <form
                      key={candidate.studentId}
                      action={issueOfferAction}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)' }}
                    >
                      <input type="hidden" name="jdId" value={jdId} />
                      <input type="hidden" name="studentId" value={candidate.studentId} />
                      <input type="hidden" name="positions" value={jd.positions} />
                      <input type="hidden" name="shortlistRemaining" value={shortlistRemaining} />
                      {jd.baseMinPaise !== undefined && <input type="hidden" name="ctcPaise" value={jd.baseMinPaise} />}
                      {jd.stipendPaise !== undefined && <input type="hidden" name="stipendPaise" value={jd.stipendPaise} />}
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
        </div>
      </section>
    </RecruiterShell>
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
