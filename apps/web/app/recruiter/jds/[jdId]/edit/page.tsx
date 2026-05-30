import type { Metadata } from 'next';
import { RecruiterAccountMenu } from '~/components/RecruiterAccountMenu';
import { notFound } from 'next/navigation';
import { RecruiterShell, StatusPill } from '@nid/ui';
import { CANONICAL_SKILLS, SKILL_GROUPS, getJd } from '@nid/module-jd-posting';
import { readRecruiterSession } from '~/lib/recruiter-session';
import { JdWizard } from '../../new/JdWizard';
import { submitEditedJdAction, updateDraftAction } from './actions';

export const metadata: Metadata = {
  title: 'Edit draft JD · Recruiter · NID Industry Interface',
  robots: { index: false, follow: false },
};

export default async function EditDraftPage({
  params,
}: {
  params: Promise<{ jdId: string }>;
}) {
  const { jdId } = await params;
  const session = await readRecruiterSession();
  const jd = getJd(jdId);

  // Guard: must exist, belong to this recruiter, and still be a draft. Published
  // / in-moderation JDs are immutable (Phase 4.2) — they can't be edited here.
  if (!jd || jd.recruiterId !== session.recruiterId) notFound();
  const editable = jd.status === 'draft';

  // Bind the draft id into the server actions so the client wizard keeps its
  // single-arg action contract.
  const boundSubmit = submitEditedJdAction.bind(null, jdId);
  const boundSave = updateDraftAction.bind(null, jdId);

  return (
    <RecruiterShell activeNav="jds" companyName={session.companyName} accountMenu={<RecruiterAccountMenu companyName={session.companyName} />}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <a href="/recruiter/jds" style={backLink}>← All JDs</a>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              <p style={eyebrow}>Spring 2026 · edit draft</p>
              <h1 style={h1}>{jd.title.trim() ? jd.title : 'Untitled draft'}</h1>
            </div>
            <StatusPill tone={editable ? 'warning' : 'neutral'}>{jd.status}</StatusPill>
          </header>

          {jd.moderationNote && (
            <div style={noteCard} role="note">
              <p style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-1)' }}>
                Clarification requested by the placement cell
              </p>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)', lineHeight: 1.5 }}>{jd.moderationNote}</p>
            </div>
          )}

          {editable ? (
            <p style={lede}>
              Update the structured fields and save, or resubmit for moderation when it&rsquo;s ready. Resubmitting
              freezes this same draft — it doesn&rsquo;t create a duplicate.
            </p>
          ) : (
            <div style={immutableCard}>
              <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)', lineHeight: 1.5 }}>
                This JD is <strong>{jd.status}</strong> and can no longer be edited — published JDs are immutable.
                To change a published role, post a new JD that replaces it.
              </p>
            </div>
          )}

          {editable && (
            <JdWizard
              skills={[...CANONICAL_SKILLS]}
              skillGroups={[...SKILL_GROUPS]}
              initial={jd}
              onSubmit={boundSubmit}
              onSaveDraft={boundSave}
              submitLabel="Save & resubmit for moderation"
              saveLabel="Save changes"
            />
          )}
        </div>
      </section>
    </RecruiterShell>
  );
}

const eyebrow = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--accent)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};
const backLink = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 'var(--space-4)',
};
const h1 = {
  fontSize: 'var(--fs-40)',
  lineHeight: 'var(--lh-48)',
  fontWeight: 'var(--fw-500)',
  color: 'var(--text-strong)',
  marginTop: 'var(--space-1)',
};
const lede = {
  fontSize: 'var(--fs-16)',
  lineHeight: 'var(--lh-30)',
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-8)',
  maxWidth: '680px',
};
const noteCard = {
  backgroundColor: 'var(--pill-warning-bg, var(--surface-panel))',
  border: '1px solid var(--border-emphasized)',
  borderRadius: 'var(--radius-3)',
  padding: 'var(--space-4)',
  marginBottom: 'var(--space-5)',
} as const;
const immutableCard = {
  backgroundColor: 'var(--surface-card)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  padding: 'var(--card-padding)',
} as const;
