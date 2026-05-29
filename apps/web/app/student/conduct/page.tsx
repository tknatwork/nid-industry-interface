import type { Metadata } from 'next';
import { StudentShell, StatusPill, Button, type StatusTone } from '@nid/ui';
import { getStudentProfile } from '@nid/module-student-portal';
import { listStudentConductFor, type StudentConductCase } from '@nid/module-admin-accountability';
import { DEMO_STUDENT } from '~/lib/demo-student';
import { appealConductAction } from './actions';

export const metadata: Metadata = {
  title: 'Conduct · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function StudentConductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { studentId } = DEMO_STUDENT;
  const studentName = getStudentProfile(studentId)?.name ?? 'Student';
  const params = await searchParams;
  const error = params.error;
  const sent = params.sent === '1';

  const cases = listStudentConductFor(studentId);

  return (
    <StudentShell activeNav="conduct" studentName={studentName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Your record</p>
            <h1 style={h1}>Conduct</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Conduct flags are raised only after an acceptance — for example a no-show or going silent after
              accepting an offer. Every flag is reviewed by a person, and you can always appeal.
            </p>
          </header>

          {sent && (
            <p role="status" style={banner}>
              Your appeal has been submitted. The conduct cell will review it and respond.
            </p>
          )}
          {error && (
            <p role="alert" style={errorBanner}>
              {decodeURIComponent(error)}
            </p>
          )}

          {cases.length === 0 ? (
            <div style={{ ...card, borderColor: 'var(--green-500)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <StatusPill tone="success">Good standing</StatusPill>
                <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
                  No conduct flags
                </p>
              </div>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)' }}>
                You have a clean record this cycle. Honouring your acceptances and showing up to booked interview
                slots keeps it that way.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {cases.map((c) => (
                <ConductCard key={c.id} kase={c} studentId={studentId} />
              ))}
            </div>
          )}
        </div>
      </section>
    </StudentShell>
  );
}

function ConductCard({ kase, studentId }: { kase: StudentConductCase; studentId: string }) {
  const decided = kase.status !== 'open';
  const appealed = Boolean(kase.appealNote);
  return (
    <article style={{ ...card, borderColor: conductTone(kase.status) === 'danger' ? 'var(--accent)' : 'var(--card-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>
            {conductKindLabel(kase.kind)}
          </p>
          <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>{kase.companyName}</p>
        </div>
        <StatusPill tone={conductTone(kase.status)}>{kase.status}</StatusPill>
      </div>

      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)' }}>{kase.description}</p>

      {decided && kase.decisionNote && (
        <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)' }}>
          <strong style={{ color: 'var(--text-strong)' }}>Decision:</strong> {kase.decisionNote}
        </p>
      )}

      {appealed ? (
        <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--radius-2)' }}>
          <strong style={{ color: 'var(--text-strong)' }}>Your appeal:</strong> {kase.appealNote}
        </p>
      ) : (
        <form action={appealConductAction} style={{ marginTop: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
          <input type="hidden" name="caseId" value={kase.id} />
          <input type="hidden" name="studentId" value={studentId} />
          <label htmlFor={`appeal-${kase.id}`} style={fieldLabel}>
            Appeal this flag
          </label>
          <textarea
            id={`appeal-${kase.id}`}
            name="appeal"
            required
            minLength={3}
            rows={4}
            placeholder="Explain your side. A reviewer reads every appeal."
            style={textareaStyle}
          />
          <div>
            <Button type="submit" variant="ghost">
              Submit appeal
            </Button>
          </div>
        </form>
      )}
    </article>
  );
}

function conductKindLabel(kind: StudentConductCase['kind']): string {
  switch (kind) {
    case 'no-show':
      return 'No-show at interview';
    case 'ghost-after-acceptance':
      return 'Went silent after acceptance';
  }
}

function conductTone(status: StudentConductCase['status']): StatusTone {
  switch (status) {
    case 'open':
      return 'info';
    case 'dismissed':
      return 'success';
    case 'warning':
      return 'warning';
    case 'visibility-reduced':
      return 'warning';
    case 'ineligible':
      return 'danger';
  }
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '2px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const fieldLabel = { display: 'block', fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const textareaStyle = { width: '100%', padding: 'var(--input-padding-y) var(--input-padding-x)', fontSize: 'var(--input-font-size)', fontFamily: 'var(--ff-sans)', color: 'var(--input-fg)', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--input-radius)', resize: 'vertical' as const };
const banner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', color: 'var(--green-500)', border: '1px solid var(--green-500)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const errorBanner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
