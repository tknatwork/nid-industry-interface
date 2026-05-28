import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudentShell, StatusPill } from '@nid/ui';
import {
  getStudentProfile,
  isOptedIn,
  listEligibleJds,
  type EligibleJd,
} from '@nid/module-student-portal';
import { isShortlisted } from '@nid/module-candidate-browse';
import { DEMO_STUDENT } from '~/lib/demo-student';
import { compLine } from '~/lib/money';

export const metadata: Metadata = {
  title: 'Openings · Student · NID Industry Interface',
  robots: { index: false, follow: false },
};

const ROLE_LABEL: Record<EligibleJd['roleType'], string> = {
  'full-time': 'Full-time',
  'vacation-internship': 'Vacation internship',
  'during-course-internship': 'During-course internship',
};

export default function StudentJdsPage() {
  const { studentId, cycleId, cycleName } = DEMO_STUDENT;
  const profile = getStudentProfile(studentId);
  if (!profile) notFound();

  const optedIn = isOptedIn(studentId, cycleId);
  const openings = listEligibleJds(studentId, cycleId);

  return (
    <StudentShell activeNav="jds" studentName={profile.name}>
      <section style={{ paddingInline: 'var(--layout-page-x)', paddingBlock: 'var(--space-10)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--space-6)' }}>
            <p style={label}>{cycleName} · {profile.disciplineName}</p>
            <h1 style={h1}>Openings for you</h1>
            <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Only openings whose target disciplines and programme match yours are shown. No ranking, no score —
              you see the full eligible set.
            </p>
          </header>

          {!optedIn ? (
            <p style={notice}>
              You are not opted in to {cycleName}.{' '}
              <a href="/student/cycles" style={accentLink}>Opt in to see openings →</a>
            </p>
          ) : openings.length === 0 ? (
            <p style={notice}>No published openings match your discipline and programme yet. Check back as recruiters publish.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
              {openings.map((jd) => {
                const shortlisted = isShortlisted(jd.jdId, studentId);
                return (
                  <article key={jd.jdId} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <div>
                        <p style={{ fontSize: 'var(--fs-20)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)' }}>{jd.title}</p>
                        <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-secondary)' }}>{jd.companyName}</p>
                      </div>
                      {shortlisted && <StatusPill tone="success">Shortlisted</StatusPill>}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                      <Tag>{ROLE_LABEL[jd.roleType]}</Tag>
                      <Tag>{jd.location}</Tag>
                      <Tag>{jd.workMode}</Tag>
                    </div>

                    <dl style={{ marginTop: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}>
                      <Row k="Compensation" v={compLine(jd)} />
                      <Row k="Open positions" v={String(jd.positions)} />
                      <Row k="Interview rounds" v={String(jd.interviewRoundCount)} />
                    </dl>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </StudentShell>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-panel)', borderRadius: 'var(--radius-pill)', padding: 'var(--space-1) var(--space-3)', textTransform: 'capitalize' }}>
      {children}
    </span>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', fontSize: 'var(--fs-14)' }}>
      <dt style={{ color: 'var(--text-secondary)' }}>{k}</dt>
      <dd style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-500)', textAlign: 'right' }}>{v}</dd>
    </div>
  );
}

const label = { fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
const h1 = { fontSize: 'var(--fs-40)', lineHeight: 'var(--lh-48)', fontWeight: 'var(--fw-500)', color: 'var(--text-strong)', marginTop: 'var(--space-1)' };
const card = { backgroundColor: 'var(--surface-card)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)' } as const;
const notice = { fontSize: 'var(--fs-14)', color: 'var(--text-secondary)', padding: 'var(--space-6)', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--border-emphasized)', textAlign: 'center' as const };
const accentLink = { color: 'var(--accent)', textDecoration: 'none', fontWeight: 'var(--fw-600)' } as const;
