import type { Metadata } from 'next';
import { StudentShell } from '@nid/ui';
import { getStudentProfile } from '@nid/module-student-portal';
import { DEMO_STUDENT } from '~/lib/demo-student';
import { submitFeedbackAction } from './actions';

export const metadata: Metadata = {
  title: 'Feedback · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

const RATINGS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '5', label: '5 — Excellent' },
  { value: '4', label: '4 — Good' },
  { value: '3', label: '3 — Okay' },
  { value: '2', label: '2 — Poor' },
  { value: '1', label: '1 — Very poor' },
];

export default async function StudentFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { studentId, cycleName } = DEMO_STUDENT;
  const studentName = getStudentProfile(studentId)?.name ?? 'Student';
  const params = await searchParams;
  const error = params.error;
  const sent = params.sent === '1';

  return (
    <StudentShell studentName={studentName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>After the cycle</p>
            <h1 style={h1}>Feedback</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              How did the {cycleName} placement cycle go for you? Your feedback is anonymous and helps the
              placement office improve the experience for the next batch.
            </p>
          </header>

          {sent ? (
            <div style={{ ...card, borderColor: 'var(--green-500)' }}>
              <p role="status" style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--green-500)' }}>
                Thank you for your feedback.
              </p>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                Your response has been recorded. It goes to the placement office anonymously.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <p role="alert" style={errorBanner}>
                  {decodeURIComponent(error)}
                </p>
              )}
              <form action={submitFeedbackAction} style={card}>
                <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
                  <div>
                    <label htmlFor="rating" style={fieldLabel}>
                      Overall rating
                    </label>
                    <select id="rating" name="rating" defaultValue="" required style={selectStyle}>
                      <option value="" disabled>
                        Pick a rating
                      </option>
                      {RATINGS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="comments" style={fieldLabel}>
                      Comments
                    </label>
                    <textarea
                      id="comments"
                      name="comments"
                      required
                      rows={6}
                      placeholder="What worked well? What would you change?"
                      style={textareaStyle}
                    />
                  </div>

                  <div>
                    <button type="submit" style={submitButton}>
                      Send feedback
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </StudentShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '2px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const fieldLabel = { display: 'block', fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const selectStyle = { width: '100%', minHeight: 'var(--input-min-height)', padding: 'var(--input-padding-y) var(--input-padding-x)', fontSize: 'var(--input-font-size)', fontFamily: 'var(--ff-sans)', color: 'var(--input-fg)', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--input-radius)' } as const;
const textareaStyle = { width: '100%', padding: 'var(--input-padding-y) var(--input-padding-x)', fontSize: 'var(--input-font-size)', fontFamily: 'var(--ff-sans)', color: 'var(--input-fg)', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--input-radius)', resize: 'vertical' as const };
const submitButton = { minHeight: 'var(--input-min-height)', paddingInline: 'var(--space-5)', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-on-accent)', backgroundColor: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-2)', cursor: 'pointer' } as const;
const errorBanner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
