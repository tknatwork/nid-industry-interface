import type { CSSProperties } from 'react';
import { Button, StatusPill, type StatusTone } from '@nid/ui';
import { getCandidate } from '@nid/module-candidate-browse';
import { getCandidateRounds, getInterviewsComplete, listSelected } from '@nid/module-interview-console';
import { getSequence, listOffers, tallyFor, type OfferRecord } from '@nid/module-offer-cascade';
import { getOfferLetter } from '@nid/module-offer-letters';
import { getStage, rankOf } from '@nid/module-recruiter-pipeline';
import type { JdRecord } from '@nid/module-jd-posting';
import { rupees } from '~/lib/money';
import { SequenceBuilder, type SequenceCandidate } from './SequenceBuilder';
import { DeadlineCountdown } from './DeadlineCountdown';
import { AcceptedStudents, type AcceptedStudent } from './AcceptedStudents';
import { LetterUploadForm } from './LetterUploadForm';
import {
  issueOfferAction,
  lockSequenceAction,
  respondAction,
  simulateDeadlineAction,
  sweepAndFloatAction,
} from './actions';
import { pushOfferLetterAction } from './letter-actions';

/**
 * OffersWorkspace — the inline offers body for `/recruiter/offers?jd=<jdId>`
 * (Round 4 §D). A Server Component: it reads the module stores, maps them to
 * plain serializable props, and passes the client islands their injected server
 * actions. The islands (SequenceBuilder / DeadlineCountdown / LetterUploadForm)
 * never import a store.
 *
 * The offer pool is `listSelected(jdId)` ONLY — the candidates the recruiter
 * selected in the After phase, never the raw shortlist. Each carries its
 * per-round scores + remarks (from `getCandidateRounds`). Until interviews are
 * complete the whole flow is gated behind a locked notice.
 *
 * Linearity: edit affordances are gated on BOTH the existing `interviewsComplete`
 * flag and the recruiter-pipeline stage (`getStage`). The sequence builder is
 * draggable only before `offer-sequencing` is reached; once locked it shows the
 * frozen numbered order. Letters surface once issuing has begun and never roll
 * the pipeline backwards (the action only advances).
 */

export interface OffersWorkspaceProps {
  readonly jd: JdRecord;
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

/** A selected candidate enriched with name + per-round scores/remarks. */
interface PoolCandidate {
  readonly studentId: string;
  readonly name: string;
  readonly disciplineName: string;
  readonly rounds: readonly { readonly round: number; readonly score?: number; readonly note?: string }[];
}

export function OffersWorkspace({ jd }: OffersWorkspaceProps) {
  const jdId = jd.id;
  const interviewsComplete = getInterviewsComplete(jdId);
  const stage = getStage(jdId);
  const seq = getSequence(jdId);
  const sequenceLocked = seq !== null;

  // Pool = After-selected ONLY, with per-round scores/remarks.
  const selected = listSelected(jdId);
  const pool: PoolCandidate[] = selected
    .map((p): PoolCandidate | null => {
      const c = getCandidate(p.studentId);
      if (!c) return null;
      const rounds = getCandidateRounds(jdId, p.studentId).perRound.map((r) => ({
        round: r.round,
        ...(r.score !== undefined ? { score: r.score } : {}),
        ...(r.note !== undefined ? { note: r.note } : {}),
      }));
      return { studentId: p.studentId, name: c.name, disciplineName: c.disciplineName, rounds };
    })
    .filter((x): x is PoolCandidate => x !== null);

  const nameByStudent = new Map(pool.map((p) => [p.studentId, p.name]));

  if (!interviewsComplete) {
    return <LockedNotice jdId={jdId} selectedCount={pool.length} />;
  }

  const offers = listOffers(jdId);
  const offeredIds = new Set(offers.map((o) => o.studentId));
  const declinedIds = new Set(offers.filter((o) => o.status === 'declined').map((o) => o.studentId));
  const tally = tallyFor(jdId, jd.positions);

  // The locked order, in sequence; else the selected pool in selection order.
  const sequenceCandidates: SequenceCandidate[] = (seq ? seq.order : pool.map((p) => p.studentId))
    .map((id) => {
      const c = pool.find((p) => p.studentId === id);
      return c ? { id, name: c.name, disciplineName: c.disciplineName } : null;
    })
    .filter((x): x is SequenceCandidate => x !== null);

  const offerablePool = pool.filter((p) => !offeredIds.has(p.studentId));
  const selectedRemaining = offerablePool.length;

  const accepted: AcceptedStudent[] = offers
    .filter((o) => o.status === 'accepted')
    .map((o) => ({ studentId: o.studentId, name: nameByStudent.get(o.studentId) ?? o.studentId, wave: o.wave }));

  // Letters can be uploaded for accepted candidates (the offer they hold is real).
  const acceptedWithLetterState = offers
    .filter((o) => o.status === 'accepted')
    .map((o) => ({
      studentId: o.studentId,
      name: nameByStudent.get(o.studentId) ?? o.studentId,
      wave: o.wave,
      hasLetter: getOfferLetter(jdId, o.studentId) !== null,
    }));

  const canIssue = sequenceLocked; // strict: issuing requires a locked order
  const pastSequencing = rankOf(stage) >= rankOf('offer-sequencing');

  const ctcPaise = jd.baseMinPaise;
  const stipendPaise = jd.stipendPaise;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      {/* Tally strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)' }}>
        <Stat label="Open positions" value={tally.positions} />
        <Stat label="Selected" value={pool.length} />
        <Stat label="Accepted" value={tally.accepted} />
        <Stat label="Outstanding" value={tally.outstanding} />
        <Stat label="Declined" value={tally.declined} />
        <Stat label="Filled" value={`${tally.filled} / ${tally.positions}`} />
      </div>

      {/* 1 — Float sequence */}
      <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <SectionHead n={1} title="Float sequence" subtitle="Set the order offers go out — then lock it." />
        {sequenceCandidates.length === 0 ? (
          <p style={notice}>No selected candidates to sequence. Select candidates on the Interview tab first.</p>
        ) : (
          <SequenceBuilder
            jdId={jdId}
            candidates={sequenceCandidates}
            locked={sequenceLocked}
            lockSequenceAction={lockSequenceAction}
          />
        )}
      </section>

      {/* 2 — Issue + live offers */}
      <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <SectionHead
          n={2}
          title="Offers"
          subtitle={canIssue ? 'Issue to the next in sequence; track live responses.' : 'Lock the sequence above to start issuing.'}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-6)' }}>
          {/* Issued offers */}
          <div style={{ display: 'grid', gap: 'var(--space-2)', alignContent: 'start' }}>
            <p style={subLabel}>Issued offers</p>
            {offers.length === 0 ? (
              <p style={notice}>No offers issued yet.</p>
            ) : (
              offers.map((o) => (
                <OfferRow
                  key={o.id}
                  offer={o}
                  jdId={jdId}
                  name={nameByStudent.get(o.studentId) ?? o.studentId}
                />
              ))
            )}
            {offers.some((o) => o.status === 'pending') && (
              <form action={sweepAndFloatAction} style={{ marginTop: 'var(--space-2)' }}>
                <input type="hidden" name="jdId" value={jdId} />
                <Button type="submit" variant="ghost" size="sm">
                  Sweep lapsed deadlines &amp; float next
                </Button>
              </form>
            )}
          </div>

          {/* Next in sequence — issuable */}
          <div style={{ display: 'grid', gap: 'var(--space-2)', alignContent: 'start' }}>
            <p style={subLabel}>Selected — not yet offered</p>
            {offerablePool.length === 0 ? (
              <p style={notice}>{pool.length === 0 ? 'No selected candidates.' : 'Everyone selected has an offer.'}</p>
            ) : (
              offerablePool.map((candidate) => (
                <form
                  key={candidate.studentId}
                  action={issueOfferAction}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)' }}
                >
                  <input type="hidden" name="jdId" value={jdId} />
                  <input type="hidden" name="studentId" value={candidate.studentId} />
                  <input type="hidden" name="positions" value={jd.positions} />
                  <input type="hidden" name="shortlistRemaining" value={selectedRemaining} />
                  {ctcPaise !== undefined && <input type="hidden" name="ctcPaise" value={ctcPaise} />}
                  {stipendPaise !== undefined && <input type="hidden" name="stipendPaise" value={stipendPaise} />}
                  <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                    <span style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{candidate.name}</span>
                    <RoundScores rounds={candidate.rounds} />
                    {declinedIds.has(candidate.studentId) && <span style={hintTiny}>previously declined</span>}
                  </div>
                  <Button type="submit" size="sm" disabled={!canIssue}>
                    Issue offer
                  </Button>
                </form>
              ))
            )}
            {!canIssue && (
              <p style={hintTiny}>Issuing is disabled until the float sequence is locked.</p>
            )}
          </div>
        </div>
      </section>

      {/* 3 — Accepted students / vacancies */}
      <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <SectionHead n={3} title="Accepted students" subtitle="Vacancies lock as students accept." />
        <AcceptedStudents filled={tally.filled} positions={jd.positions} accepted={accepted} />
      </section>

      {/* 4 — Offer letters */}
      <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <SectionHead
          n={4}
          title="Offer letters"
          subtitle="Upload each accepted student's signed PDF — the institute stamps a certificate of authenticity."
        />
        {acceptedWithLetterState.length === 0 ? (
          <p style={notice}>Once a student accepts, upload their offer letter here.</p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {acceptedWithLetterState.map((a) => (
              <div key={a.studentId} style={letterCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{a.name}</span>
                  <StatusPill tone={a.hasLetter ? 'success' : 'neutral'}>{a.hasLetter ? 'Letter sent' : 'No letter yet'}</StatusPill>
                </div>
                <LetterUploadForm
                  jdId={jdId}
                  studentId={a.studentId}
                  studentName={a.name}
                  wave={a.wave}
                  hasLetter={a.hasLetter}
                  pushOfferLetterAction={pushOfferLetterAction}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {pastSequencing && (
        <p style={hintTiny}>
          Pipeline stage: <strong>{stage}</strong>. Stages move forward only — earlier steps are read-only.
        </p>
      )}
    </div>
  );
}

/** Pre-complete gate: the whole flow is locked until interviews are marked complete. */
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
        Finish recording round outcomes and confirm your selected candidates on the Interview tab. Sending the
        After-phase decision letter there opens the offer cascade — you&apos;ll then sequence and float offers to your{' '}
        {selectedCount === 0 ? 'selected candidates' : `${selectedCount} selected candidate${selectedCount === 1 ? '' : 's'}`}, in order.
      </p>
      <a href={`/recruiter/interviews?jd=${encodeURIComponent(jdId)}&phase=after`} style={{ textDecoration: 'none' }}>
        <Button size="sm">Go to the Interview tab →</Button>
      </a>
    </div>
  );
}

function OfferRow({ offer, jdId, name }: { offer: OfferRecord; jdId: string; name: string }) {
  return (
    <div style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div>
          <p style={{ fontSize: 'var(--fs-16)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{name}</p>
          <p style={hintTiny}>
            Wave {offer.wave}
            {offer.ctcPaise !== undefined ? ` · ${rupees(offer.ctcPaise)} / yr` : offer.stipendPaise !== undefined ? ` · ${rupees(offer.stipendPaise)} / mo` : ''}
          </p>
        </div>
        <StatusPill tone={offerTone(offer.status)}>{offer.status}</StatusPill>
      </div>

      {offer.status === 'pending' && (
        <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          {offer.deadlineIso !== undefined && <DeadlineCountdown deadlineIso={offer.deadlineIso} />}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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
            <form action={simulateDeadlineAction}>
              <input type="hidden" name="jdId" value={jdId} />
              <input type="hidden" name="studentId" value={offer.studentId} />
              <Button type="submit" size="sm" variant="ghost">Simulate deadline passed</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RoundScores({ rounds }: { rounds: PoolCandidate['rounds'] }) {
  const scored = rounds.filter((r) => r.score !== undefined);
  if (scored.length === 0) return <span style={hintTiny}>No round scores recorded.</span>;
  return (
    <span style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      {scored.map((r) => (
        <span key={r.round} style={scoreChip} title={r.note ?? undefined}>
          R{r.round}: {r.score}/10
        </span>
      ))}
    </span>
  );
}

function SectionHead({ n, title, subtitle }: { n: number; title: string; subtitle: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <span style={stepBadge}>{n}</span>
      <div>
        <h2 style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', margin: 0 }}>{title}</h2>
        <p style={hintTiny}>{subtitle}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3) var(--space-4)' }}>
      <p style={{ fontSize: 'var(--fs-24)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', lineHeight: 1 }}>{value}</p>
      <p style={{ ...subLabel, marginTop: 'var(--space-1)' }}>{label}</p>
    </div>
  );
}

const subLabel: CSSProperties = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
const hintTiny: CSSProperties = { fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' };
const notice: CSSProperties = {
  fontSize: 'var(--fs-14)',
  color: 'var(--text-secondary)',
  padding: 'var(--space-4)',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 'var(--radius-2)',
  border: '1px dashed var(--border-emphasized)',
  textAlign: 'center',
};
const stepBadge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'var(--space-7)',
  height: 'var(--space-7)',
  flexShrink: 0,
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--accent)',
  color: 'var(--text-on-accent, #fff)',
  fontSize: 'var(--fs-14)',
  fontWeight: 'var(--fw-700)',
};
const scoreChip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 var(--space-2)',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--surface-panel)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
};
const letterCard: CSSProperties = {
  backgroundColor: 'var(--surface-panel)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
};
