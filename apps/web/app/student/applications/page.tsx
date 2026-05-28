import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudentShell, StatusPill, type StatusTone } from '@nid/ui';
import { getStudentProfile, companyNameFor } from '@nid/module-student-portal';
import { listJdsByStatus, type JdRecord } from '@nid/module-jd-posting';
import { listShortlist } from '@nid/module-candidate-browse';
import { listAssignmentsForJd, slotById } from '@nid/module-slot-booking';
import { listOffers, type OfferRecord } from '@nid/module-offer-cascade';
import { DEMO_STUDENT } from '~/lib/demo-student';
import { rupees } from '~/lib/money';

export const metadata: Metadata = {
  title: 'Applications · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

interface AppView {
  readonly jd: JdRecord;
  readonly companyName: string;
  readonly shortlistedAt?: string;
  readonly slot?: { day: string; startTime: string; endTime: string; meetingLinkUrl?: string };
  readonly offer?: OfferRecord;
}

export default function StudentApplicationsPage() {
  const { studentId } = DEMO_STUDENT;
  const profile = getStudentProfile(studentId);
  if (!profile) notFound();

  // Composition root: assemble per-JD status from candidate-browse + slot-booking
  // + offer-cascade — the same pattern the recruiter offers page uses.
  const apps: AppView[] = [];
  for (const jd of listJdsByStatus('published')) {
    const sl = listShortlist(jd.id).find((s) => s.candidate.studentId === studentId);
    const assignment = listAssignmentsForJd(jd.id).find((a) => a.studentId === studentId);
    const offer = listOffers(jd.id).find((o) => o.studentId === studentId);
    if (!sl && !assignment && !offer) continue;

    const slot = assignment ? slotById(assignment.slotId) : null;
    apps.push({
      jd,
      companyName: companyNameFor(jd.recruiterId),
      ...(sl ? { shortlistedAt: sl.shortlistedAt } : {}),
      ...(slot
        ? {
            slot: {
              day: slot.day,
              startTime: slot.startTime,
              endTime: slot.endTime,
              ...(assignment?.meetingLinkUrl ? { meetingLinkUrl: assignment.meetingLinkUrl } : {}),
            },
          }
        : {}),
      ...(offer ? { offer } : {}),
    });
  }

  return (
    <StudentShell activeNav="applications" studentName={profile.name}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Your progress</p>
            <h1 style={h1}>Applications</h1>
          </header>

          {apps.length === 0 ? (
            <p style={notice}>
              No activity yet. When a recruiter shortlists you, it appears here.{' '}
              <a href="/student/jds" style={accentLink}>See openings →</a>
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {apps.map((a) => (
                <article key={a.jd.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{a.jd.title}</p>
                      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>{a.companyName}</p>
                    </div>
                    {a.offer && <StatusPill tone={offerTone(a.offer.status)}>{a.offer.status}</StatusPill>}
                  </div>

                  <ol style={{ listStyle: 'none', margin: 'var(--space-5) 0 0', padding: 0, display: 'grid', gap: 'var(--space-4)' }}>
                    <Stage done label="Shortlisted" detail={a.shortlistedAt ? `Recruiter shortlisted you · ${fmtDate(a.shortlistedAt)}` : 'Pending'} active={!a.shortlistedAt} />
                    <Stage
                      done={!!a.slot}
                      label="Interview slot"
                      detail={
                        a.slot
                          ? `${fmtDay(a.slot.day)} · ${a.slot.startTime}–${a.slot.endTime}${a.slot.meetingLinkUrl ? '' : ' · link to be shared'}`
                          : 'Not scheduled yet'
                      }
                    >
                      {a.slot?.meetingLinkUrl && (
                        <a href={a.slot.meetingLinkUrl} target="_blank" rel="noreferrer noopener" style={{ ...accentLink, fontSize: 'var(--fs-14)' }}>
                          Join link →
                        </a>
                      )}
                    </Stage>
                    <Stage
                      done={a.offer?.status === 'accepted'}
                      active={a.offer?.status === 'pending'}
                      label="Offer"
                      detail={offerDetail(a.offer)}
                    >
                      {a.offer?.status === 'pending' && (
                        <a href="/student/offers" style={{ ...accentLink, fontSize: 'var(--fs-14)' }}>Respond in your offer inbox →</a>
                      )}
                    </Stage>
                  </ol>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </StudentShell>
  );
}

function Stage({
  done,
  active,
  label: l,
  detail,
  children,
}: {
  done?: boolean;
  active?: boolean;
  label: string;
  detail: string;
  children?: React.ReactNode;
}) {
  const dotColor = done ? 'var(--green-500)' : active ? 'var(--accent)' : 'var(--border-emphasized)';
  return (
    <li style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <span
        aria-hidden
        style={{ marginTop: '3px', width: '12px', height: '12px', borderRadius: 'var(--radius-pill)', backgroundColor: dotColor, flexShrink: 0 }}
      />
      <div>
        <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)' }}>{l}</p>
        <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>{detail}</p>
        {children}
      </div>
    </li>
  );
}

function offerDetail(offer?: OfferRecord): string {
  if (!offer) return 'No offer yet';
  const amount = offer.ctcPaise !== undefined ? `${rupees(offer.ctcPaise)} / yr` : offer.stipendPaise !== undefined ? `${rupees(offer.stipendPaise)} / mo` : '';
  switch (offer.status) {
    case 'pending':
      return `Offer extended${amount ? ` · ${amount}` : ''} · awaiting your response`;
    case 'accepted':
      return `You accepted${amount ? ` · ${amount}` : ''}`;
    case 'declined':
      return 'You declined this offer';
    case 'expired':
      return 'Offer window expired';
  }
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
const accentLink = { color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)' } as const;
