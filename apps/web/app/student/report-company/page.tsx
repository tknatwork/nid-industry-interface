import type { Metadata } from 'next';
import { StudentShell } from '@nid/ui';
import { getStudentProfile } from '@nid/module-student-portal';
import { DEMO_STUDENT } from '~/lib/demo-student';
import { fileRedressalAction } from './actions';

export const metadata: Metadata = {
  title: 'Report a company · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

const STUDENT_LABEL = 'M.Des Product Design · batch 2025';
const DEMO_RECRUITER_ID = 'NID-2026-A-0001';
const DEMO_COMPANY_NAME = 'Acme Design Studio';

const CATEGORIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'stipend-not-paid', label: 'Stipend not paid' },
  { value: 'scope-creep-mid-internship', label: 'Scope creep mid-internship' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'jd-term-breach', label: 'JD term breach' },
  { value: 'contract-dishonoured', label: 'Contract dishonoured' },
];

export default async function ReportCompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { studentId } = DEMO_STUDENT;
  const studentName = getStudentProfile(studentId)?.name ?? 'Student';
  const params = await searchParams;
  const error = params.error;
  const sent = params.sent === '1';

  return (
    <StudentShell activeNav="report" studentName={studentName}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>Redressal</p>
            <h1 style={h1}>Report a company</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Filing a complaint sends it to the institution&apos;s redressal cell, where it is reviewed
              individually. Your report is never used to rank companies automatically — a person decides the
              outcome and the company is told the substance, not your identity beyond your programme.
            </p>
          </header>

          {sent && (
            <p role="status" style={banner}>
              Your report has been filed with the redressal cell. You&apos;ll hear back once it&apos;s reviewed.
            </p>
          )}
          {error && (
            <p role="alert" style={errorBanner}>
              {decodeURIComponent(error)}
            </p>
          )}

          <form action={fileRedressalAction} style={card}>
            <input type="hidden" name="recruiterId" value={DEMO_RECRUITER_ID} />
            <input type="hidden" name="companyName" value={DEMO_COMPANY_NAME} />
            <input type="hidden" name="studentLabel" value={STUDENT_LABEL} />

            <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
              <div>
                <label htmlFor="company" style={fieldLabel}>
                  Company
                </label>
                <select id="company" name="company" defaultValue={DEMO_COMPANY_NAME} style={selectStyle}>
                  <option value={DEMO_COMPANY_NAME}>{DEMO_COMPANY_NAME}</option>
                </select>
                <p style={help}>You can only report a company you&apos;ve interacted with this cycle.</p>
              </div>

              <div>
                <label htmlFor="category" style={fieldLabel}>
                  What went wrong
                </label>
                <select id="category" name="category" defaultValue="" required style={selectStyle}>
                  <option value="" disabled>
                    Select a category
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" style={fieldLabel}>
                  What happened
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  minLength={10}
                  rows={6}
                  placeholder="Describe what happened, in your own words (minimum 10 characters)."
                  style={textareaStyle}
                />
                <p style={help}>Be specific. This goes straight to a reviewer, not to the company verbatim.</p>
              </div>

              <label style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="checkbox" name="isInternship" style={{ marginTop: '0.2em' }} />
                <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>
                  This concerns an <strong style={{ color: 'var(--text-strong)' }}>internship</strong> — internships
                  follow a stricter review timeline.
                </span>
              </label>

              <div>
                <button type="submit" style={submitButton}>
                  File report
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </StudentShell>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '2px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const fieldLabel = { display: 'block', fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 'var(--space-2)' };
const help = { marginTop: 'var(--space-1)', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', lineHeight: 1.4 } as const;
const selectStyle = { width: '100%', minHeight: 'var(--input-min-height)', padding: 'var(--input-padding-y) var(--input-padding-x)', fontSize: 'var(--input-font-size)', fontFamily: 'var(--ff-sans)', color: 'var(--input-fg)', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--input-radius)' } as const;
const textareaStyle = { width: '100%', padding: 'var(--input-padding-y) var(--input-padding-x)', fontSize: 'var(--input-font-size)', fontFamily: 'var(--ff-sans)', color: 'var(--input-fg)', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--input-radius)', resize: 'vertical' as const };
const submitButton = { minHeight: 'var(--input-min-height)', paddingInline: 'var(--space-5)', fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-on-accent)', backgroundColor: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-2)', cursor: 'pointer' } as const;
const banner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--surface-card)', color: 'var(--green-500)', border: '1px solid var(--green-500)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
const errorBanner = { marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderRadius: 'var(--radius-3)', fontWeight: 'var(--fw-600)' } as const;
