import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { RecruiterShell } from '@nid/ui';
import { CANONICAL_SKILLS, SKILL_GROUPS } from '@nid/module-jd-posting';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { JdWizard } from './JdWizard';
import { saveNewDraftAction, submitNewJdAction } from './actions';

export const metadata: Metadata = {
  title: 'Post a JD · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function NewJdPage() {
  const recruiter = await readRecruiterSession();
  return (
    <RecruiterShell activeNav="jds" companyName={recruiter.companyName} accountMenu={<RecruiterAccountMenu companyName={recruiter.companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p
            style={{
              fontSize: 'var(--fs-12)',
              fontWeight: 'var(--fw-600)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 'var(--space-2)',
            }}
          >
            Spring 2026 · structured JD
          </p>
          <h1
            style={{
              fontSize: 'var(--fs-40)',
              lineHeight: 'var(--lh-48)',
              fontWeight: 'var(--fw-500)',
              color: 'var(--text-strong)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Post a job description
          </h1>
          <p
            style={{
              fontSize: 'var(--fs-16)',
              lineHeight: 'var(--lh-30)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-8)',
              maxWidth: '680px',
            }}
          >
            NID uses a structured JD. Fill the fields below — they make the role unambiguous for
            students and let the placement cell match the right disciplines. You can save a draft
            and finish later, or submit for moderation when ready.
          </p>

          <JdWizard
            skills={[...CANONICAL_SKILLS]}
            skillGroups={[...SKILL_GROUPS]}
            onSubmit={submitNewJdAction}
            onSaveDraft={saveNewDraftAction}
          />
        </div>
      </section>
    </RecruiterShell>
  );
}
