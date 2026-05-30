import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudentShell, StatusPill, Button, type StatusTone } from '@nid/ui';
import { getStudentProfile, companyNameFor } from '@nid/module-student-portal';
import { listJdsByStatus } from '@nid/module-jd-posting';
import { listOffers, type OfferRecord } from '@nid/module-offer-cascade';
import { getOfferLetter, type OfferCertificate } from '@nid/module-offer-letters';
import { DEMO_STUDENT } from '~/lib/demo-student';
import { rupees } from '~/lib/money';
import { respondToOfferAction } from './actions';
import { StudentLetterViewer } from './StudentLetterViewer';

export const metadata: Metadata = {
  title: 'Offers · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

interface OfferView {
  readonly offer: OfferRecord;
  readonly jdTitle: string;
  readonly companyName: string;
  /** Set for an ACCEPTED offer that has an uploaded letter (Round 4 §D). The
   *  base64 feeds the client viewer; the certificate drives the badge + verify
   *  link. Never present for pending/declined/expired offers. */
  readonly letter?: {
    readonly pdfBase64: string;
    readonly fileName: string;
    readonly certificate: OfferCertificate;
  };
}

export default async function StudentOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { studentId } = DEMO_STUDENT;
  const profile = getStudentProfile(studentId);
  if (!profile) notFound();
  const error = (await searchParams).error;

  const offers: OfferView[] = [];
  for (const jd of listJdsByStatus('published')) {
    for (const offer of listOffers(jd.id)) {
      if (offer.studentId === studentId) {
        // For an accepted offer, surface its uploaded letter (if any): the base64
        // for the in-browser viewer and the institute certificate for the badge.
        const letterRecord = offer.status === 'accepted' ? getOfferLetter(jd.id, studentId) : null;
        offers.push({
          offer,
          jdTitle: jd.title,
          companyName: companyNameFor(jd.recruiterId),
          ...(letterRecord
            ? {
                letter: {
                  pdfBase64: letterRecord.pdfBase64,
                  fileName: letterRecord.fileName,
                  certificate: letterRecord.certificate,
                },
              }
            : {}),
        });
      }
    }
  }
  offers.sort((a, b) => b.offer.issuedAt.localeCompare(a.offer.issuedAt));
  const pending = offers.filter((o) => o.offer.status === 'pending');

  return (
    <StudentShell activeNav="offers" studentName={profile.name}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Your decisions</p>
            <h1 style={h1}>Offer inbox</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Accepting or declining here is final and notifies the recruiter immediately. Declining lets the
              recruiter float the position to the next shortlisted candidate.
            </p>
          </header>

          {error && <p role="alert" style={errorBanner}>{decodeURIComponent(error)}</p>}

          {offers.length === 0 ? (
            <p style={notice}>No offers yet. You&apos;ll see any offer here the moment a recruiter extends it.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {pending.length > 0 && (
                <p style={{ ...label, color: 'var(--accent)' }}>{pending.length} awaiting your response</p>
              )}
              {offers.map(({ offer, jdTitle, companyName, letter }) => (
                <article key={offer.id} style={{ ...card, borderColor: offer.status === 'pending' ? 'var(--accent)' : 'var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{jdTitle}</p>
                      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>{companyName} · Wave {offer.wave}</p>
                    </div>
                    <StatusPill tone={offerTone(offer.status)}>{offer.status}</StatusPill>
                  </div>

                  <p style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginTop: 'var(--space-3)' }}>
                    {offer.ctcPaise !== undefined ? `${rupees(offer.ctcPaise)} / yr` : offer.stipendPaise !== undefined ? `${rupees(offer.stipendPaise)} / mo` : 'Amount to be confirmed'}
                  </p>

                  {offer.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <form action={respondToOfferAction}>
                        <input type="hidden" name="jdId" value={offer.jdId} />
                        <input type="hidden" name="studentId" value={studentId} />
                        <input type="hidden" name="decision" value="accepted" />
                        <Button type="submit">Accept offer</Button>
                      </form>
                      <form action={respondToOfferAction} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <input type="hidden" name="jdId" value={offer.jdId} />
                        <input type="hidden" name="studentId" value={studentId} />
                        <input type="hidden" name="decision" value="declined" />
                        <label style={{ display: 'grid', gap: 'var(--space-1)' }}>
                          <span style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>Reason (optional)</span>
                          <input
                            name="reason"
                            maxLength={280}
                            placeholder="e.g. accepting another role"
                            style={{ fontSize: 'var(--fs-14)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2)', minWidth: '220px' }}
                          />
                        </label>
                        <Button type="submit" variant="ghost">Decline</Button>
                      </form>
                    </div>
                  ) : (
                    <div style={{ marginTop: 'var(--space-3)', display: 'grid', gap: 'var(--space-3)' }}>
                      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
                        {offer.status === 'accepted' && 'You accepted this offer. A code-of-conduct acknowledgement applies on joining.'}
                        {offer.status === 'declined' && `You declined this offer${offer.responseReason ? ` — “${offer.responseReason}”` : ''}.`}
                        {offer.status === 'expired' && 'This offer window expired.'}
                      </p>

                      {offer.status === 'accepted' && letter && (
                        <div style={letterPanel}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                            <StudentLetterViewer pdfBase64={letter.pdfBase64} fileName={letter.fileName} />
                            {letter.certificate.instituteApproved && (
                              <StatusPill tone="success">Institute-approved certificate</StatusPill>
                            )}
                          </div>
                          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
                            Your offer letter carries a certificate of authenticity.{' '}
                            <a href={letter.certificate.verifyPath} style={{ color: 'var(--accent)' }}>
                              Verify this certificate →
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </StudentShell>
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
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '2px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
const errorBanner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const letterPanel = { display: 'grid', gap: 'var(--space-2)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-panel)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)' } as const;
