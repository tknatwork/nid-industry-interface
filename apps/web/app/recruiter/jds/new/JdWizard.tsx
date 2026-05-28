'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field } from '@nid/ui';
import type { CanonicalSkill, SkillGroup, GateFailure } from '@nid/module-jd-posting';
import { saveDraftAction, submitJdAction, type JdWizardPayload } from '../actions';

type RoleType = 'full-time' | 'vacation-internship' | 'during-course-internship';
type SkillState = 'off' | 'preferred' | 'required';

const RESPONSIBILITY_CATEGORIES = [
  { key: 'discovery', label: 'Discovery' },
  { key: 'definition', label: 'Definition' },
  { key: 'design', label: 'Design' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'ops', label: 'Ops' },
] as const;

export function JdWizard({
  skills,
  skillGroups,
}: {
  skills: CanonicalSkill[];
  skillGroups: { key: SkillGroup; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failure, setFailure] = useState<GateFailure | null>(null);

  // Role basics
  const [title, setTitle] = useState('');
  const [roleType, setRoleType] = useState<RoleType>('full-time');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('onsite');
  const [positions, setPositions] = useState('1');

  // Compensation (rupees in the form; converted to paise on submit)
  const [baseMin, setBaseMin] = useState('');
  const [baseMax, setBaseMax] = useState('');
  const [stipend, setStipend] = useState('');
  const [gpAck, setGpAck] = useState(false);

  // Targeting
  const [programmes, setProgrammes] = useState<{ bachelors: boolean; masters: boolean }>({
    bachelors: false,
    masters: true,
  });

  // Skills
  const [skillState, setSkillState] = useState<Record<string, SkillState>>({});

  // Responsibilities
  const [responsibilities, setResponsibilities] = useState<Record<string, string>>({});

  // Deliverables + prose
  const [deliverables, setDeliverables] = useState('');
  const [prose, setProse] = useState('');

  // Interview rounds
  const [rounds, setRounds] = useState<{ focus: string }[]>([{ focus: '' }]);

  const isInternship = roleType !== 'full-time';

  function buildPayload(): JdWizardPayload {
    const rupeesToPaise = (s: string): number | undefined => {
      const n = Number(s.replace(/[, ]/g, ''));
      return s.trim() === '' || !Number.isFinite(n) ? undefined : Math.round(n * 100);
    };

    const selectedSkills = Object.entries(skillState)
      .filter(([, st]) => st !== 'off')
      .map(([slug, st]) => ({ slug, required: st === 'required' }));

    const respObj: Record<string, string[]> = {};
    for (const cat of RESPONSIBILITY_CATEGORIES) {
      const lines = (responsibilities[cat.key] ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length > 0) respObj[cat.key] = lines;
    }

    const targetProgrammes = [
      ...(programmes.bachelors ? ['bachelors'] : []),
      ...(programmes.masters ? ['masters'] : []),
    ];

    return {
      title: title.trim(),
      roleType,
      location: location.trim(),
      workMode,
      positions: Number(positions) || 1,
      ...(isInternship
        ? { stipendPaise: rupeesToPaise(stipend) }
        : { baseMinPaise: rupeesToPaise(baseMin), baseMaxPaise: rupeesToPaise(baseMax) }),
      targetProgrammes,
      skills: selectedSkills,
      responsibilities: respObj,
      deliverables: deliverables
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
      supplementaryProseMd: prose.trim() || undefined,
      interviewRounds: rounds
        .map((r, i) => ({ round: i + 1, focus: r.focus.trim() }))
        .filter((r) => r.focus.length > 0),
      gpFeeAcknowledged: gpAck,
    };
  }

  function run(action: (p: JdWizardPayload) => Promise<{ ok: boolean; failure?: GateFailure }>) {
    setFailure(null);
    const payload = buildPayload();
    startTransition(async () => {
      const result = await action(payload);
      if (result.ok) {
        router.push('/recruiter/jds');
      } else if (result.failure) {
        setFailure(result.failure);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {failure && <FailureBanner failure={failure} />}

      <Section title="Role basics">
        <Field id="title" label="Role title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior UX Designer" />
        <div style={twoCol}>
          <Select id="roleType" label="Role type" value={roleType} onChange={(v) => setRoleType(v as RoleType)} options={[
            { value: 'full-time', label: 'Full-time' },
            { value: 'vacation-internship', label: 'Vacation internship' },
            { value: 'during-course-internship', label: 'During-course internship' },
          ]} />
          <Select id="workMode" label="Work mode" value={workMode} onChange={setWorkMode} options={[
            { value: 'onsite', label: 'Onsite' },
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' },
          ]} />
        </div>
        <div style={twoCol}>
          <Field id="location" label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru" />
          <Field id="positions" label="Open positions" type="number" min={1} value={positions} onChange={(e) => setPositions(e.target.value)} />
        </div>
      </Section>

      <Section title="Compensation" hint={isInternship ? 'Internship stipend is a single monthly figure.' : 'Full-time roles require a salary range — both ends must clear the institution floor.'}>
        {isInternship ? (
          <>
            <Field id="stipend" label="Monthly stipend (₹)" value={stipend} onChange={(e) => setStipend(e.target.value)} placeholder="e.g. 30000" inputMode="numeric" />
            <label style={checkboxRow}>
              <input type="checkbox" checked={gpAck} onChange={(e) => setGpAck(e.target.checked)} />
              <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)' }}>
                I acknowledge the ₹5,000 per-intake GP fee is invoiced to us, not deducted from the student stipend.
              </span>
            </label>
          </>
        ) : (
          <div style={twoCol}>
            <Field id="baseMin" label="Annual CTC — minimum (₹)" value={baseMin} onChange={(e) => setBaseMin(e.target.value)} placeholder="e.g. 800000" inputMode="numeric" />
            <Field id="baseMax" label="Annual CTC — maximum (₹)" value={baseMax} onChange={(e) => setBaseMax(e.target.value)} placeholder="e.g. 1200000" inputMode="numeric" />
          </div>
        )}
      </Section>

      <Section title="Target programmes" hint="Which student cohorts is this role open to?">
        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
          <label style={checkboxRow}>
            <input type="checkbox" checked={programmes.bachelors} onChange={(e) => setProgrammes((p) => ({ ...p, bachelors: e.target.checked }))} />
            <span>B.Des (Bachelors)</span>
          </label>
          <label style={checkboxRow}>
            <input type="checkbox" checked={programmes.masters} onChange={(e) => setProgrammes((p) => ({ ...p, masters: e.target.checked }))} />
            <span>M.Des (Masters)</span>
          </label>
        </div>
      </Section>

      <Section title="Skills" hint="Mark each skill required or preferred. Engineering skills bundled into a design role raise the stipend floor (scope-creep guard).">
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          {skillGroups.map((group) => {
            const groupSkills = skills.filter((s) => s.group === group.key);
            if (groupSkills.length === 0) return null;
            return (
              <fieldset key={group.key} style={{ border: 'none', margin: 0, padding: 0 }}>
                <legend style={legendStyle}>{group.label}</legend>
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  {groupSkills.map((s) => (
                    <SkillRow
                      key={s.slug}
                      label={s.label}
                      value={skillState[s.slug] ?? 'off'}
                      onChange={(v) => setSkillState((prev) => ({ ...prev, [s.slug]: v }))}
                    />
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
      </Section>

      <Section title="Responsibilities" hint="Group by phase. One responsibility per line. This helps map effort distribution to compensation.">
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {RESPONSIBILITY_CATEGORIES.map((cat) => (
            <TextArea
              key={cat.key}
              id={`resp-${cat.key}`}
              label={cat.label}
              value={responsibilities[cat.key] ?? ''}
              onChange={(v) => setResponsibilities((prev) => ({ ...prev, [cat.key]: v }))}
              placeholder="One responsibility per line"
              rows={3}
            />
          ))}
        </div>
      </Section>

      <Section title="Deliverables & success criteria" hint="What does success look like? One per line.">
        <TextArea id="deliverables" label="Deliverables" value={deliverables} onChange={setDeliverables} placeholder="One deliverable per line" rows={4} />
      </Section>

      <Section title="Supplementary description (optional)">
        <TextArea id="prose" label="Narrative" value={prose} onChange={setProse} placeholder="Any additional context. The structured fields above are authoritative." rows={5} />
      </Section>

      <Section title="Interview rounds" hint="Declared upfront — students see this before applying.">
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {rounds.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Field
                  id={`round-${i}`}
                  label={`Round ${i + 1} focus`}
                  value={r.focus}
                  onChange={(e) => setRounds((prev) => prev.map((x, j) => (j === i ? { focus: e.target.value } : x)))}
                  placeholder="e.g. Portfolio review"
                />
              </div>
              {rounds.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setRounds((prev) => prev.filter((_, j) => j !== i))}>
                  Remove
                </Button>
              )}
            </div>
          ))}
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setRounds((prev) => [...prev, { focus: '' }])}>
              + Add round
            </Button>
          </div>
        </div>
      </Section>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', paddingTop: 'var(--space-4)' }}>
        <Button type="button" disabled={pending} onClick={() => run(submitJdAction)} size="lg">
          {pending ? 'Working…' : 'Submit for moderation'}
        </Button>
        <Button type="button" disabled={pending} variant="secondary" size="lg" onClick={() => run(saveDraftAction)}>
          Save draft
        </Button>
      </div>
    </div>
  );
}

function FailureBanner({ failure }: { failure: GateFailure }) {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'var(--pill-danger-bg)',
        color: 'var(--pill-danger-fg)',
        borderRadius: 'var(--radius-3)',
        padding: 'var(--space-4)',
      }}
    >
      <p style={{ fontWeight: 'var(--fw-600)', marginBottom: failure.fieldErrors ? 'var(--space-2)' : 0 }}>
        {failure.message}
      </p>
      {failure.fieldErrors && (
        <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-14)' }}>
          {Object.entries(failure.fieldErrors).map(([field, errs]) => (
            <li key={field}>
              <strong>{field}:</strong> {errs.join(', ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding-loose)',
      }}
    >
      <h2 style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginBottom: hint ? 'var(--space-1)' : 'var(--space-4)' }}>
        {title}
      </h2>
      {hint && <p style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>{hint}</p>}
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>{children}</div>
    </section>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          minHeight: 'var(--input-min-height)',
          padding: 'var(--input-padding-y) var(--input-padding-x)',
          fontSize: 'var(--input-font-size)',
          fontFamily: 'var(--ff-sans)',
          color: 'var(--input-fg)',
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: 'var(--input-radius)',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        style={{
          width: '100%',
          padding: 'var(--input-padding-y) var(--input-padding-x)',
          fontSize: 'var(--input-font-size)',
          fontFamily: 'var(--ff-sans)',
          color: 'var(--input-fg)',
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: 'var(--input-radius)',
          resize: 'vertical',
          lineHeight: 1.5,
        }}
      />
    </div>
  );
}

function SkillRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SkillState;
  onChange: (v: SkillState) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-2)',
        backgroundColor: value === 'off' ? 'transparent' : 'var(--surface-page)',
        border: '1px solid var(--border-default)',
      }}
    >
      <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
        {(['off', 'preferred', 'required'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
            style={{
              padding: 'var(--space-1) var(--space-3)',
              fontSize: 'var(--fs-12)',
              fontWeight: 'var(--fw-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-emphasized)',
              cursor: 'pointer',
              backgroundColor: value === opt ? 'var(--accent)' : 'transparent',
              color: value === opt ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              transition: 'background-color var(--motion-micro)',
            }}
          >
            {opt === 'off' ? '—' : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

const twoCol = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 'var(--space-4)',
} as const;

const labelStyle = {
  display: 'block',
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: 'var(--space-2)',
};

const legendStyle = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  marginBottom: 'var(--space-2)',
  padding: 0,
};

const checkboxRow = {
  display: 'flex',
  gap: 'var(--space-3)',
  alignItems: 'center',
  fontSize: 'var(--fs-14)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
} as const;
