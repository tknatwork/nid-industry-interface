'use client';

import { useMemo, useState, useTransition, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Overlay, ProgressTracker, VoiceInput, type ProgressStep } from '@nid/ui';
import {
  expectedWorkFor,
  floorPaiseFor,
  isInternshipRoleType,
  type CanonicalSkill,
  type ExpectedWorkRef,
  type GateFailure,
  type JdRecord,
  type Programme,
  type SkillGroup,
} from '@nid/module-jd-posting/client';
import { parseUploadedJd, type ParsedJd } from './parse-jd';
import type { JdWizardPayload, WizardAction } from './wizard-types';

// Re-export the action contract for convenience so callers can import it from
// the wizard module if they prefer; the source of truth is ./wizard-types.
export type { JdWizardActionResult, JdWizardPayload, WizardAction } from './wizard-types';

type RoleType = 'full-time' | 'vacation-internship' | 'during-course-internship';
type SkillState = 'off' | 'preferred' | 'required';

const RESPONSIBILITY_CATEGORIES = [
  { key: 'discovery', label: 'Discovery' },
  { key: 'definition', label: 'Definition' },
  { key: 'design', label: 'Design' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'ops', label: 'Ops' },
] as const;

/** rupees → paise; blank/non-finite → undefined (so optional fields stay absent). */
function rupeesToPaise(s: string): number | undefined {
  const n = Number(s.replace(/[, ]/g, ''));
  return s.trim() === '' || !Number.isFinite(n) ? undefined : Math.round(n * 100);
}
/** paise → a rupee string for prefilling an input. */
function paiseToRupees(p: number | undefined): string {
  return p === undefined ? '' : String(Math.round(p / 100));
}
/** ₹ display for the predictor nudge. */
function rupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

interface ProgrammeCompState {
  baseMin: string;
  baseMax: string;
  stipend: string;
}

interface EvalTaskState {
  required: boolean;
  title: string;
  brief: string;
  estimatedHours: string;
  releaseAlignedToCycle: boolean;
}

/** Build initial wizard state from an existing draft (edit route) or empty. */
function deriveInitial(initial: JdRecord | undefined) {
  const roleType: RoleType = initial?.roleType ?? 'full-time';
  const skillState: Record<string, SkillState> = {};
  for (const s of initial?.skills ?? []) skillState[s.slug] = s.required ? 'required' : 'preferred';

  const responsibilities: Record<string, string> = {};
  for (const cat of RESPONSIBILITY_CATEGORIES) {
    const lines = initial?.responsibilities[cat.key];
    if (lines && lines.length > 0) responsibilities[cat.key] = lines.join('\n');
  }

  const pc = initial?.programmeCompensation;
  return {
    title: initial?.title ?? '',
    roleType,
    location: initial?.location ?? '',
    workMode: initial?.workMode ?? 'onsite',
    positions: String(initial?.positions ?? 1),
    baseMin: paiseToRupees(initial?.baseMinPaise),
    baseMax: paiseToRupees(initial?.baseMaxPaise),
    stipend: paiseToRupees(initial?.stipendPaise),
    gpAck: initial?.gpFeeAcknowledged ?? false,
    programmes: {
      bachelors: initial?.targetProgrammes.includes('bachelors') ?? false,
      masters: initial?.targetProgrammes.includes('masters') ?? true,
    },
    bachelorsComp: {
      baseMin: paiseToRupees(pc?.bachelors?.baseMinPaise),
      baseMax: paiseToRupees(pc?.bachelors?.baseMaxPaise),
      stipend: paiseToRupees(pc?.bachelors?.stipendPaise),
    } as ProgrammeCompState,
    mastersComp: {
      baseMin: paiseToRupees(pc?.masters?.baseMinPaise),
      baseMax: paiseToRupees(pc?.masters?.baseMaxPaise),
      stipend: paiseToRupees(pc?.masters?.stipendPaise),
    } as ProgrammeCompState,
    skillState,
    responsibilities,
    deliverables: (initial?.deliverables ?? []).join('\n'),
    prose: initial?.supplementaryProseMd ?? '',
    rounds:
      initial && initial.interviewRounds.length > 0
        ? initial.interviewRounds.map((r) => ({ focus: r.focus, liveExercise: r.liveExercise ?? false }))
        : [{ focus: '', liveExercise: false }],
    evalTask: {
      required: initial?.evaluationTask?.required ?? false,
      title: initial?.evaluationTask?.title ?? '',
      brief: initial?.evaluationTask?.briefMd ?? '',
      estimatedHours:
        initial?.evaluationTask?.estimatedHours !== undefined
          ? String(initial.evaluationTask.estimatedHours)
          : '',
      releaseAlignedToCycle: initial?.evaluationTask?.releaseAlignedToCycle ?? true,
    } as EvalTaskState,
  };
}

export interface JdWizardProps {
  readonly skills: CanonicalSkill[];
  readonly skillGroups: { key: SkillGroup; label: string }[];
  /** Action for "Submit for moderation" (strict gate). */
  readonly onSubmit: WizardAction;
  /** Action for "Save draft" (permissive). */
  readonly onSaveDraft: WizardAction;
  /** Existing draft to prefill (edit route). Omitted on the new route. */
  readonly initial?: JdRecord;
  /** Submit button label override (edit route says "Save & resubmit…"). */
  readonly submitLabel?: string;
  /** Save-draft button label override. */
  readonly saveLabel?: string;
}

export function JdWizard({
  skills,
  skillGroups,
  onSubmit,
  onSaveDraft,
  initial,
  submitLabel = 'Submit for moderation',
  saveLabel = 'Save draft',
}: JdWizardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failure, setFailure] = useState<GateFailure | null>(null);

  const seed = useMemo(() => deriveInitial(initial), [initial]);

  // Role basics
  const [title, setTitle] = useState(seed.title);
  const [roleType, setRoleType] = useState<RoleType>(seed.roleType);
  const [location, setLocation] = useState(seed.location);
  const [workMode, setWorkMode] = useState(seed.workMode);
  const [positions, setPositions] = useState(seed.positions);

  // Single-programme compensation (rupees in the form)
  const [baseMin, setBaseMin] = useState(seed.baseMin);
  const [baseMax, setBaseMax] = useState(seed.baseMax);
  const [stipend, setStipend] = useState(seed.stipend);
  const [gpAck, setGpAck] = useState(seed.gpAck);

  // Targeting
  const [programmes, setProgrammes] = useState(seed.programmes);

  // Per-programme compensation (active only when BOTH programmes targeted)
  const [bachelorsComp, setBachelorsComp] = useState<ProgrammeCompState>(seed.bachelorsComp);
  const [mastersComp, setMastersComp] = useState<ProgrammeCompState>(seed.mastersComp);

  // Skills
  const [skillState, setSkillState] = useState<Record<string, SkillState>>(seed.skillState);

  // Responsibilities + prose
  const [responsibilities, setResponsibilities] = useState<Record<string, string>>(seed.responsibilities);
  const [deliverables, setDeliverables] = useState(seed.deliverables);
  const [prose, setProse] = useState(seed.prose);

  // Interview rounds
  const [rounds, setRounds] = useState<{ focus: string; liveExercise: boolean }[]>(seed.rounds);

  // Evaluation task
  const [evalTask, setEvalTask] = useState<EvalTaskState>(seed.evalTask);

  // Upload → parse
  const [parsing, setParsing] = useState(false);
  const [parseSummary, setParseSummary] = useState<ParsedJd | null>(null);
  const [showBlanks, setShowBlanks] = useState(false);

  const isInternship = roleType !== 'full-time';
  const bothProgrammes = programmes.bachelors && programmes.masters;
  const splitComp = bothProgrammes; // per-programme inputs replace the single block

  // A JD may impose at most ONE unpaid evaluative task: a required take-home OR
  // a live whiteboarding round — never both (values-over-money). Surfaced as a
  // live warning + a submit block here; the server moderation schema mirrors it.
  const liveExerciseRound = rounds.some((r) => r.liveExercise);
  const assessmentConflict = evalTask.required && liveExerciseRound;

  // ── live salary predictor ──────────────────────────────────────────────────
  // Reuse the module's floors × scope multiplier. Engineering skills bundled
  // into the role bump the floor ×1.4 (the deterministic scope-creep guard),
  // exactly as the submit gate does — surfaced live as skills change.
  const engineeringSlugs = useMemo(
    () => new Set(skills.filter((s) => s.group === 'engineering').map((s) => s.slug)),
    [skills],
  );
  const hasEngineering = useMemo(
    () => Object.entries(skillState).some(([slug, st]) => st !== 'off' && engineeringSlugs.has(slug)),
    [skillState, engineeringSlugs],
  );
  const scopeMultiplier = hasEngineering ? 1.4 : 1;

  const selectedProgrammes = useMemo<Programme[]>(
    () => [
      ...(programmes.bachelors ? (['bachelors'] as const) : []),
      ...(programmes.masters ? (['masters'] as const) : []),
    ],
    [programmes],
  );

  const prediction = useMemo(
    () =>
      computePrediction({
        roleType,
        selectedProgrammes,
        scopeMultiplier,
        isInternship,
        splitComp,
        single: { baseMin, baseMax, stipend },
        bachelorsComp,
        mastersComp,
      }),
    [roleType, selectedProgrammes, scopeMultiplier, isInternship, splitComp, baseMin, baseMax, stipend, bachelorsComp, mastersComp],
  );

  const expectedWork = isInternshipRoleType(roleType) ? expectedWorkFor(roleType) : null;

  function buildPayload(): JdWizardPayload {
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

    const targetProgrammes = selectedProgrammes.map((p) => p);

    const base: JdWizardPayload = {
      title: title.trim(),
      roleType,
      location: location.trim(),
      workMode,
      positions: Number(positions) || 1,
      targetProgrammes,
      skills: selectedSkills,
      responsibilities: respObj,
      deliverables: deliverables
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
      interviewRounds: rounds
        .map((r, i) => ({ round: i + 1, focus: r.focus.trim(), liveExercise: r.liveExercise }))
        .filter((r) => r.focus.length > 0),
      gpFeeAcknowledged: gpAck,
    };

    const withProse = prose.trim() ? { ...base, supplementaryProseMd: prose.trim() } : base;

    // Compensation. For a single programme the top-level block is authoritative.
    // When BOTH programmes are targeted, `programmeCompensation` is the source
    // of truth and the gate reads it per-programme (each against its own floor).
    // We still mirror the M.Des (masters) figures onto the top-level fields, but
    // that mirror is now DISPLAY-ONLY: list cards and legacy single-value
    // surfaces read the top-level comp, while the floor gate + admin report read
    // `programmeCompensation` directly. The mirror no longer affects whether the
    // JD passes the gate.
    const comp: Partial<JdWizardPayload> = splitComp
      ? {
          programmeCompensation: {
            bachelors: programmeCompPayload(isInternship, bachelorsComp),
            masters: programmeCompPayload(isInternship, mastersComp),
          },
          ...(isInternship
            ? omitUndefinedComp({ stipendPaise: rupeesToPaise(mastersComp.stipend) })
            : omitUndefinedComp({
                baseMinPaise: rupeesToPaise(mastersComp.baseMin),
                baseMaxPaise: rupeesToPaise(mastersComp.baseMax),
              })),
        }
      : isInternship
        ? omitUndefinedComp({ stipendPaise: rupeesToPaise(stipend) })
        : omitUndefinedComp({ baseMinPaise: rupeesToPaise(baseMin), baseMaxPaise: rupeesToPaise(baseMax) });

    const evalPayload = evalTask.required || evalTask.title.trim()
      ? {
          evaluationTask: {
            required: evalTask.required,
            title: evalTask.title.trim(),
            releaseAlignedToCycle: evalTask.releaseAlignedToCycle,
            ...(evalTask.brief.trim() ? { briefMd: evalTask.brief.trim() } : {}),
            ...(evalTask.estimatedHours.trim() && Number.isFinite(Number(evalTask.estimatedHours))
              ? { estimatedHours: Number(evalTask.estimatedHours) }
              : {}),
          },
        }
      : {};

    return { ...withProse, ...comp, ...evalPayload };
  }

  function run(action: WizardAction, isSubmit: boolean) {
    setFailure(null);

    // Live predictor BLOCKS submit whenever a programme's offer is below its
    // floor — the SAME boundary the server gate enforces (offered <
    // adjustedFloor). The mild/severe split is message tone only, not the gate,
    // so the client never tells the recruiter a below-floor figure is
    // submittable. Saving a draft is never blocked.
    if (isSubmit && prediction.blocks) {
      setFailure({
        kind: 'stipend-floor',
        message: prediction.blockMessage,
        floorPaise: prediction.floorPaise,
      });
      scrollTop();
      return;
    }

    // One unpaid evaluative task per role — block a take-home + whiteboarding combo.
    if (isSubmit && assessmentConflict) {
      setFailure({
        kind: 'schema',
        message:
          'Choose either a take-home assignment OR a live whiteboarding round — not both. NID limits each role to one unpaid evaluative task so students aren’t asked to do two projects’ worth of free work.',
      });
      scrollTop();
      return;
    }

    const payload = buildPayload();
    startTransition(async () => {
      const result = await action(payload);
      if (result.ok) {
        router.push('/recruiter/jds');
      } else if (result.failure) {
        setFailure(result.failure);
        scrollTop();
      }
    });
  }

  // ── upload → parse → prefill → pop remaining blanks ─────────────────────────
  async function handleUpload() {
    setParsing(true);
    setFailure(null);
    try {
      const parsed = await parseUploadedJd();
      applyParsed(parsed);
      setParseSummary(parsed);
      setShowBlanks(true);
    } finally {
      setParsing(false);
    }
  }

  function applyParsed(p: ParsedJd) {
    if (p.title) setTitle(p.title);
    if (p.roleType) setRoleType(p.roleType);
    if (p.location) setLocation(p.location);
    if (p.workMode) setWorkMode(p.workMode);
    if (p.positions !== undefined) setPositions(String(p.positions));
    if (p.baseMinRupees !== undefined) setBaseMin(String(p.baseMinRupees));
    if (p.baseMaxRupees !== undefined) setBaseMax(String(p.baseMaxRupees));
    if (p.stipendRupees !== undefined) setStipend(String(p.stipendRupees));
    if (p.programmes) setProgrammes(p.programmes);
    if (p.skills) {
      setSkillState((prev) => {
        const next = { ...prev };
        for (const [slug, st] of Object.entries(p.skills ?? {})) next[slug] = st;
        return next;
      });
    }
    if (p.responsibilities) {
      setResponsibilities((prev) => ({ ...prev, ...p.responsibilities }));
    }
    if (p.deliverables) setDeliverables(p.deliverables);
    if (p.supplementaryProse) setProse(p.supplementaryProse);
    if (p.interviewRounds && p.interviewRounds.length > 0) {
      setRounds(p.interviewRounds.map((focus) => ({ focus, liveExercise: false })));
    }
  }

  // ── section completion (drives the sticky ProgressTracker) ──────────────────
  const completion = useMemo(
    () =>
      computeCompletion({
        title,
        location,
        positions,
        isInternship,
        splitComp,
        single: { baseMin, baseMax, stipend },
        bachelorsComp,
        mastersComp,
        gpAck,
        programmes,
        skillState,
        responsibilities,
        deliverables,
        rounds,
        evalTask,
      }),
    [title, location, positions, isInternship, splitComp, baseMin, baseMax, stipend, bachelorsComp, mastersComp, gpAck, programmes, skillState, responsibilities, deliverables, rounds, evalTask],
  );

  const missingMandatory = completion.filter((s) => s.mandatory && !s.done).map((s) => s.label);
  const progressSteps: ProgressStep[] = completion.map((s) => ({ label: s.label, done: s.done }));

  return (
    <div style={layoutGrid}>
      {/* main column */}
      <div style={{ display: 'grid', gap: 'var(--space-6)', minWidth: 0 }}>
        {failure && <FailureBanner failure={failure} />}

        <UploadCard onUpload={handleUpload} parsing={parsing} summary={parseSummary} />

        <Section title="Role basics">
          <Field id="title" label="Role title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior UX Designer" />
          <div style={twoCol}>
            <Select id="roleType" label="Role type" value={roleType} onChange={(v) => setRoleType(v as RoleType)} options={[
              { value: 'full-time', label: 'Full-time' },
              { value: 'vacation-internship', label: 'Vacation internship' },
              { value: 'during-course-internship', label: 'During-course internship' },
            ]} />
            <Select id="workMode" label="Work mode" value={workMode} onChange={(v) => setWorkMode(v as 'onsite' | 'remote' | 'hybrid')} options={[
              { value: 'onsite', label: 'Onsite' },
              { value: 'remote', label: 'Remote' },
              { value: 'hybrid', label: 'Hybrid' },
            ]} />
          </div>
          <div style={twoCol}>
            <Field id="location" label="Location" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru" />
            <Field id="positions" label="Open positions" required type="number" min={1} value={positions} onChange={(e) => setPositions(e.target.value)} />
          </div>

          {expectedWork && <ExpectedWorkPanel info={expectedWork} />}
        </Section>

        <Section
          title="Compensation"
          hint={
            splitComp
              ? 'This JD targets both B.Des and M.Des, so compensation is captured per programme — each gated to its own floor, and M.Des must be at least B.Des.'
              : isInternship
                ? 'Internship stipend is a single monthly figure, gated to the institution floor.'
                : 'Full-time roles require a salary range — both ends must clear the institution floor.'
          }
        >
          {splitComp ? (
            <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
              <ProgrammeCompFields
                programme="bachelors"
                label="B.Des (Bachelors)"
                isInternship={isInternship}
                value={bachelorsComp}
                onChange={setBachelorsComp}
                floorPaise={floorPaiseFor('bachelors', roleType)}
                scopeMultiplier={scopeMultiplier}
              />
              <ProgrammeCompFields
                programme="masters"
                label="M.Des (Masters)"
                isInternship={isInternship}
                value={mastersComp}
                onChange={setMastersComp}
                floorPaise={floorPaiseFor('masters', roleType)}
                scopeMultiplier={scopeMultiplier}
              />
            </div>
          ) : isInternship ? (
            <>
              <Field id="stipend" label="Monthly stipend (₹)" required value={stipend} onChange={(e) => setStipend(e.target.value)} placeholder="e.g. 30000" inputMode="numeric" />
              <label style={checkboxRow}>
                <input type="checkbox" checked={gpAck} onChange={(e) => setGpAck(e.target.checked)} />
                <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)' }}>
                  I acknowledge the ₹5,000 per-intake GP fee is invoiced to us, not deducted from the student stipend.
                </span>
              </label>
            </>
          ) : (
            <div style={twoCol}>
              <Field id="baseMin" label="Annual CTC — minimum (₹)" required value={baseMin} onChange={(e) => setBaseMin(e.target.value)} placeholder="e.g. 800000" inputMode="numeric" />
              <Field id="baseMax" label="Annual CTC — maximum (₹)" required value={baseMax} onChange={(e) => setBaseMax(e.target.value)} placeholder="e.g. 1200000" inputMode="numeric" />
            </div>
          )}

          <SalaryPredictorNudge prediction={prediction} hasEngineering={hasEngineering} />
        </Section>

        <Section title="Target programmes" hint="Which student cohorts is this role open to? Selecting both unlocks per-programme compensation above.">
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

        <Section title="Skills" hint="Mark each skill required or preferred. Engineering skills bundled into a design role raise the predicted floor (scope-creep guard) — watch the predictor.">
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
                        flagged={group.key === 'engineering'}
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

        <Section title="Responsibilities" hint="Group by phase. One responsibility per line. Use the mic to dictate where your browser supports it.">
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {RESPONSIBILITY_CATEGORIES.map((cat) => (
              <TextArea
                key={cat.key}
                id={`resp-${cat.key}`}
                label={cat.label}
                value={responsibilities[cat.key] ?? ''}
                onChange={(v) => setResponsibilities((prev) => ({ ...prev, [cat.key]: v }))}
                onDictate={(text) =>
                  setResponsibilities((prev) => ({ ...prev, [cat.key]: appendLine(prev[cat.key] ?? '', text) }))
                }
                placeholder="One responsibility per line"
                rows={3}
              />
            ))}
          </div>
        </Section>

        <Section title="Deliverables & success criteria" hint="What does success look like? One per line.">
          <TextArea
            id="deliverables"
            label="Deliverables"
            value={deliverables}
            onChange={setDeliverables}
            onDictate={(text) => setDeliverables((prev) => appendLine(prev, text))}
            placeholder="One deliverable per line"
            rows={4}
          />
        </Section>

        <Section title="Supplementary description (optional)">
          <TextArea
            id="prose"
            label="Narrative"
            value={prose}
            onChange={setProse}
            onDictate={(text) => setProse((prev) => appendLine(prev, text))}
            placeholder="Any additional context. The structured fields above are authoritative."
            rows={5}
          />
        </Section>

        <Section title="Evaluation task (optional)" hint="Optionally require a take-home / evaluation task. Pick a take-home OR a live whiteboarding round (below) — NID allows only one unpaid evaluative task per role. Release is aligned to the cycle's institute dates so the timeline can't stall.">
          <EvaluationTaskFields value={evalTask} onChange={setEvalTask} />
        </Section>

        {assessmentConflict && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--pill-warning-bg, var(--surface-panel))',
              border: '1px solid var(--border-emphasized)',
              borderRadius: 'var(--radius-3)',
              padding: 'var(--space-4)',
              fontSize: 'var(--fs-14)',
              color: 'var(--text-strong)',
              lineHeight: 1.5,
            }}
          >
            <strong>Pick one evaluative task.</strong> You&rsquo;ve set both a required take-home assignment and a live
            whiteboarding round. NID limits each role to <em>one</em> unpaid evaluative task so students aren&rsquo;t asked
            to do two projects&rsquo; worth of free work — turn off the take-home or the whiteboarding round to continue.
          </div>
        )}

        <Section title="Interview rounds" hint="Declared upfront — students see this before applying. Flag a round as a live design exercise / whiteboarding only if you are NOT requiring a take-home task.">
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {rounds.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-2)',
                }}
              >
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Field
                      id={`round-${i}`}
                      label={`Round ${i + 1} focus`}
                      value={r.focus}
                      onChange={(e) => setRounds((prev) => prev.map((x, j) => (j === i ? { ...x, focus: e.target.value } : x)))}
                      placeholder="e.g. Portfolio review"
                    />
                  </div>
                  {rounds.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setRounds((prev) => prev.filter((_, j) => j !== i))}>
                      Remove
                    </Button>
                  )}
                </div>
                <label style={checkboxRow}>
                  <input
                    type="checkbox"
                    checked={r.liveExercise}
                    onChange={(e) => setRounds((prev) => prev.map((x, j) => (j === i ? { ...x, liveExercise: e.target.checked } : x)))}
                  />
                  <span style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--text-primary)' }}>
                    Live design exercise / whiteboarding in this round (in lieu of a take-home task)
                  </span>
                </label>
              </div>
            ))}
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setRounds((prev) => [...prev, { focus: '', liveExercise: false }])}>
                + Add round
              </Button>
            </div>
          </div>
        </Section>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', paddingTop: 'var(--space-4)' }}>
          <Button type="button" disabled={pending} onClick={() => run(onSubmit, true)} size="lg">
            {pending ? 'Working…' : submitLabel}
          </Button>
          <Button type="button" disabled={pending} variant="secondary" size="lg" onClick={() => run(onSaveDraft, false)}>
            {saveLabel}
          </Button>
        </div>
      </div>

      {/* sticky progress rail (top-right) */}
      <aside style={asideStyle}>
        <ProgressTracker
          title="Your progress"
          steps={progressSteps}
          style={{ position: 'sticky', top: 'var(--space-6)' }}
        />
      </aside>

      {/* remaining-blanks pop-up after an upload prefill */}
      <Overlay open={showBlanks} onClose={() => setShowBlanks(false)} title="We prefilled what we could">
        <BlanksDialogBody
          summary={parseSummary}
          missing={missingMandatory}
          onClose={() => setShowBlanks(false)}
        />
      </Overlay>
    </div>
  );
}

// ── upload control ───────────────────────────────────────────────────────────

function UploadCard({
  onUpload,
  parsing,
  summary,
}: {
  onUpload: () => void;
  parsing: boolean;
  summary: ParsedJd | null;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-panel)',
        border: '1px dashed var(--border-emphasized)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        display: 'flex',
        gap: 'var(--space-4)',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ maxWidth: '520px' }}>
        <p style={{ fontSize: 'var(--fs-14)', fontWeight: 'var(--fw-600)', color: 'var(--text-strong)', marginBottom: 'var(--space-1)' }}>
          Already have a JD?
        </p>
        <p style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Upload your existing description and we&rsquo;ll prefill the structured fields, then point you at the few
          mandatory blanks left to fill. AI only maps your text onto the form — it never scores or filters anyone.
        </p>
        {summary && (
          <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
            Last prefill source:{' '}
            <strong style={{ color: 'var(--text-strong)' }}>
              {summary.source === 'analyzer' ? 'ML extract' : 'sample mapper'}
            </strong>
          </p>
        )}
      </div>
      <Button type="button" variant="secondary" onClick={onUpload} disabled={parsing}>
        {parsing ? 'Reading…' : 'Upload your JD'}
      </Button>
    </div>
  );
}

function BlanksDialogBody({
  summary,
  missing,
  onClose,
}: {
  summary: ParsedJd | null;
  missing: string[];
  onClose: () => void;
}) {
  const filledCount = summary ? countFilled(summary) : 0;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
        We read your JD and filled <strong>{filledCount}</strong> field{filledCount === 1 ? '' : 's'} for you. Review
        everything before submitting — the structured fields are what students see.
      </p>
      {missing.length > 0 ? (
        <div>
          <p style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
            Still need from you
          </p>
          <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', display: 'grid', gap: 'var(--space-1)' }}>
            {missing.map((m) => (
              <li key={m} style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>{m}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
          Every mandatory section has content. Give it a once-over and submit when ready.
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="button" onClick={onClose}>Got it — let me finish</Button>
      </div>
    </div>
  );
}

// ── expected-work panel (internship role-types) ────────────────────────────────

function ExpectedWorkPanel({ info }: { info: ExpectedWorkRef }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-page)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-3)',
        padding: 'var(--space-4)',
        marginTop: 'var(--space-2)',
      }}
    >
      <p style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--accent-strong, var(--accent))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1)' }}>
        {info.label} — what a student is expected to do
      </p>
      <p style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
        {info.timeCommitment}
      </p>
      <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <p style={miniHeading}>Realistically delivers</p>
          <ul style={miniList}>
            {info.expectedWork.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
        <div>
          <p style={miniHeading}>Not expected</p>
          <ul style={miniList}>
            {info.notExpected.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── per-programme compensation fields ──────────────────────────────────────────

function ProgrammeCompFields({
  programme,
  label,
  isInternship,
  value,
  onChange,
  floorPaise,
  scopeMultiplier,
}: {
  programme: Programme;
  label: string;
  isInternship: boolean;
  value: ProgrammeCompState;
  onChange: (next: ProgrammeCompState) => void;
  floorPaise: number;
  scopeMultiplier: number;
}) {
  const adjustedFloor = Math.round(floorPaise * scopeMultiplier);
  return (
    <fieldset style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)', margin: 0 }}>
      <legend style={{ ...legendStyle, padding: '0 var(--space-2)' }}>{label}</legend>
      {isInternship ? (
        <Field
          id={`comp-${programme}-stipend`}
          label="Monthly stipend (₹)"
          required
          value={value.stipend}
          onChange={(e) => onChange({ ...value, stipend: e.target.value })}
          placeholder="e.g. 30000"
          inputMode="numeric"
        />
      ) : (
        <div style={twoCol}>
          <Field
            id={`comp-${programme}-min`}
            label="Annual CTC — min (₹)"
            required
            value={value.baseMin}
            onChange={(e) => onChange({ ...value, baseMin: e.target.value })}
            placeholder="e.g. 800000"
            inputMode="numeric"
          />
          <Field
            id={`comp-${programme}-max`}
            label="Annual CTC — max (₹)"
            required
            value={value.baseMax}
            onChange={(e) => onChange({ ...value, baseMax: e.target.value })}
            placeholder="e.g. 1200000"
            inputMode="numeric"
          />
        </div>
      )}
      <p style={{ fontSize: 'var(--fs-12)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
        Floor for {label}: <strong style={{ color: 'var(--text-strong)' }}>{rupees(adjustedFloor)}</strong>
        {scopeMultiplier > 1 ? ' (incl. ×1.4 scope-creep guard)' : ''}
        {isInternship ? ' / month' : ' / annum'}
      </p>
    </fieldset>
  );
}

// ── salary predictor nudge ──────────────────────────────────────────────────────

function SalaryPredictorNudge({
  prediction,
  hasEngineering,
}: {
  prediction: Prediction;
  hasEngineering: boolean;
}) {
  const tone =
    prediction.severity === 'severe'
      ? { bg: 'var(--pill-danger-bg)', fg: 'var(--pill-danger-fg)', border: 'var(--pill-danger-fg)' }
      : prediction.severity === 'mild'
        ? { bg: 'var(--pill-warning-bg, var(--surface-panel))', fg: 'var(--pill-warning-fg, var(--text-strong))', border: 'var(--border-emphasized)' }
        : { bg: 'var(--surface-page)', fg: 'var(--text-strong)', border: 'var(--border-default)' };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginTop: 'var(--space-3)',
        borderRadius: 'var(--radius-3)',
        border: `1px solid ${tone.border}`,
        backgroundColor: tone.bg,
        padding: 'var(--space-4)',
      }}
    >
      <p style={{ fontSize: 'var(--fs-12)', fontWeight: 'var(--fw-600)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1)' }}>
        Expected range for this role
      </p>
      <p style={{ fontSize: 'var(--fs-18)', fontWeight: 'var(--fw-600)', color: tone.fg, lineHeight: 1.3 }}>
        {prediction.rangeLabel}
      </p>
      <p style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)', lineHeight: 1.5 }}>
        {prediction.note}
        {hasEngineering ? ' Engineering skills are bundled, so the floor is raised ×1.4 (scope-creep guard).' : ''}
      </p>
      {prediction.blocks && (
        <p style={{ fontSize: 'var(--fs-13, 13px)', color: tone.fg, fontWeight: 'var(--fw-600)', marginTop: 'var(--space-2)' }}>
          Submission is blocked until compensation clears the floor.
        </p>
      )}
    </div>
  );
}

// ── evaluation-task fields ──────────────────────────────────────────────────────

function EvaluationTaskFields({
  value,
  onChange,
}: {
  value: EvalTaskState;
  onChange: (next: EvalTaskState) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <label style={checkboxRow}>
        <input
          type="checkbox"
          checked={value.required}
          onChange={(e) => onChange({ ...value, required: e.target.checked })}
        />
        <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
          Require an evaluation task from shortlisted candidates
        </span>
      </label>

      {value.required && (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <Field
            id="eval-title"
            label="Task title"
            required
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="e.g. Redesign an onboarding flow"
          />
          <TextArea
            id="eval-brief"
            label="Brief (optional)"
            value={value.brief}
            onChange={(brief) => onChange({ ...value, brief })}
            onDictate={(text) => onChange({ ...value, brief: appendLine(value.brief, text) })}
            placeholder="What should the candidate produce? Scope it to the estimated hours."
            rows={3}
          />
          <div style={twoCol}>
            <Field
              id="eval-hours"
              label="Estimated hours"
              type="number"
              min={1}
              max={80}
              value={value.estimatedHours}
              onChange={(e) => onChange({ ...value, estimatedHours: e.target.value })}
              placeholder="e.g. 6"
            />
            <label style={{ ...checkboxRow, alignItems: 'flex-start', paddingTop: 'var(--space-5)' }}>
              <input
                type="checkbox"
                checked={value.releaseAlignedToCycle}
                onChange={(e) => onChange({ ...value, releaseAlignedToCycle: e.target.checked })}
              />
              <span style={{ fontSize: 'var(--fs-13, 13px)', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                Release aligned to the cycle&rsquo;s institute dates (recommended — keeps the timeline on track)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ── shared presentational atoms ────────────────────────────────────────────────

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
  onDictate,
  placeholder,
  rows,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onDictate?: (text: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
        {onDictate && <VoiceInput onText={onDictate} label={`Dictate ${label}`} />}
      </div>
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
  flagged,
}: {
  label: string;
  value: SkillState;
  onChange: (v: SkillState) => void;
  flagged?: boolean;
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
      <span style={{ fontSize: 'var(--fs-14)', color: 'var(--text-strong)' }}>
        {label}
        {flagged && value !== 'off' && (
          <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--fs-12)', color: 'var(--text-secondary)' }}>
            · raises floor
          </span>
        )}
      </span>
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

// ── pure helpers ───────────────────────────────────────────────────────────────

function appendLine(existing: string, text: string): string {
  const trimmed = existing.replace(/\s+$/, '');
  return trimmed.length === 0 ? text : `${trimmed}\n${text}`;
}

function scrollTop() {
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** A compensation slice with all members optional (matches the payload shape). */
type CompSlice = { baseMinPaise?: number; baseMaxPaise?: number; stipendPaise?: number };

/** Build a per-programme comp payload object, omitting undefined optionals. */
function programmeCompPayload(isInternship: boolean, c: ProgrammeCompState): CompSlice {
  if (isInternship) return omitUndefinedComp({ stipendPaise: rupeesToPaise(c.stipend) });
  return omitUndefinedComp({ baseMinPaise: rupeesToPaise(c.baseMin), baseMaxPaise: rupeesToPaise(c.baseMax) });
}

/**
 * Drop keys whose value is undefined so optional fields stay *absent* rather
 * than present-with-undefined (required under exactOptionalPropertyTypes). Typed
 * to the fixed compensation slice — no generic index-signature gymnastics.
 */
function omitUndefinedComp(input: {
  baseMinPaise?: number | undefined;
  baseMaxPaise?: number | undefined;
  stipendPaise?: number | undefined;
}): CompSlice {
  const out: CompSlice = {};
  if (input.baseMinPaise !== undefined) out.baseMinPaise = input.baseMinPaise;
  if (input.baseMaxPaise !== undefined) out.baseMaxPaise = input.baseMaxPaise;
  if (input.stipendPaise !== undefined) out.stipendPaise = input.stipendPaise;
  return out;
}

function countFilled(p: ParsedJd): number {
  let n = 0;
  if (p.title) n += 1;
  if (p.roleType) n += 1;
  if (p.location) n += 1;
  if (p.workMode) n += 1;
  if (p.baseMinRupees !== undefined || p.stipendRupees !== undefined) n += 1;
  if (p.programmes && (p.programmes.bachelors || p.programmes.masters)) n += 1;
  if (p.skills && Object.keys(p.skills).length > 0) n += 1;
  if (p.responsibilities && Object.keys(p.responsibilities).length > 0) n += 1;
  if (p.deliverables) n += 1;
  if (p.interviewRounds && p.interviewRounds.length > 0) n += 1;
  return n;
}

// ── completion model (drives ProgressTracker + blanks dialog) ───────────────────

interface CompletionStep {
  readonly label: string;
  readonly done: boolean;
  readonly mandatory: boolean;
}

function computeCompletion(args: {
  title: string;
  location: string;
  positions: string;
  isInternship: boolean;
  splitComp: boolean;
  single: { baseMin: string; baseMax: string; stipend: string };
  bachelorsComp: ProgrammeCompState;
  mastersComp: ProgrammeCompState;
  gpAck: boolean;
  programmes: { bachelors: boolean; masters: boolean };
  skillState: Record<string, SkillState>;
  responsibilities: Record<string, string>;
  deliverables: string;
  rounds: { focus: string }[];
  evalTask: EvalTaskState;
}): CompletionStep[] {
  const basicsDone = args.title.trim().length >= 3 && args.location.trim().length >= 2 && (Number(args.positions) || 0) >= 1;

  const compFilled = (c: ProgrammeCompState) =>
    args.isInternship ? c.stipend.trim() !== '' : c.baseMin.trim() !== '' && c.baseMax.trim() !== '';
  const compDone = args.splitComp
    ? compFilled(args.bachelorsComp) && compFilled(args.mastersComp)
    : args.isInternship
      ? args.single.stipend.trim() !== ''
      : args.single.baseMin.trim() !== '' && args.single.baseMax.trim() !== '';

  const programmesDone = args.programmes.bachelors || args.programmes.masters;
  const skillsDone = Object.values(args.skillState).some((st) => st !== 'off');
  const responsibilitiesDone = Object.values(args.responsibilities).some((v) => v.trim().length > 0);
  const deliverablesDone = args.deliverables.trim().length > 0;
  const roundsDone = args.rounds.some((r) => r.focus.trim().length > 0);
  // Evaluation task: complete if not required, or required-with-title.
  const evalDone = !args.evalTask.required || args.evalTask.title.trim().length > 0;

  return [
    { label: 'Role basics', done: basicsDone, mandatory: true },
    { label: 'Compensation', done: compDone, mandatory: true },
    { label: 'Target programmes', done: programmesDone, mandatory: true },
    { label: 'Skills', done: skillsDone, mandatory: true },
    { label: 'Responsibilities', done: responsibilitiesDone, mandatory: false },
    { label: 'Deliverables', done: deliverablesDone, mandatory: true },
    { label: 'Evaluation task', done: evalDone, mandatory: false },
    { label: 'Interview rounds', done: roundsDone, mandatory: true },
  ];
}

// ── salary prediction model ─────────────────────────────────────────────────────

type PredictionSeverity = 'ok' | 'mild' | 'severe';

interface Prediction {
  readonly floorPaise: number;
  readonly rangeLabel: string;
  readonly note: string;
  readonly severity: PredictionSeverity;
  // `blocks` is the submit-gate decision and MUST mirror the server gate
  // (offered < adjustedFloor → block). `severity` is message tone ONLY — the
  // `mild` band (just under the floor) still blocks, it just gets gentler copy.
  // Keeping these separate is what stops the client from telling the recruiter
  // a below-floor figure is submittable when the server will reject it.
  readonly blocks: boolean;
  readonly blockMessage: string;
}

type CompTriple = { baseMin: string; baseMax: string; stipend: string };

/**
 * Live expected-range prediction, evaluated PER PROGRAMME against that
 * programme's OWN floor — matching the server gate (jd-posting
 * `evaluateProgrammeFloors`). The "expected range" is a programme's floor
 * (after the scope multiplier) up to a recommended ceiling (+60%). Severity
 * compares the offered compensation to the floor:
 *  - severe: offered is meaningfully below the floor → blocks submit
 *  - mild:   offered is just at/around the floor → nudge only
 *  - ok:     offered clears the recommended band, or nothing entered yet
 *
 * In split (both-programmes) mode each programme is predicted against its OWN
 * floor and the WORST result drives the nudge + block — so a B.Des figure is
 * never measured against the M.Des floor (the over-enforcement bug). Single-
 * programme JDs predict the one programme against its floor.
 */
function computePrediction(args: {
  roleType: RoleType;
  selectedProgrammes: Programme[];
  scopeMultiplier: number;
  isInternship: boolean;
  splitComp: boolean;
  single: CompTriple;
  bachelorsComp: ProgrammeCompState;
  mastersComp: ProgrammeCompState;
}): Prediction {
  const programmes =
    args.selectedProgrammes.length > 0 ? args.selectedProgrammes : (['masters'] as Programme[]);

  if (args.splitComp && programmes.includes('bachelors') && programmes.includes('masters')) {
    const bachelors = programmePrediction({
      programme: 'bachelors',
      roleType: args.roleType,
      scopeMultiplier: args.scopeMultiplier,
      isInternship: args.isInternship,
      comp: args.bachelorsComp,
    });
    const masters = programmePrediction({
      programme: 'masters',
      roleType: args.roleType,
      scopeMultiplier: args.scopeMultiplier,
      isInternship: args.isInternship,
      comp: args.mastersComp,
    });
    return worsePrediction(bachelors, masters);
  }

  // Single programme — the single comp block against that programme's own floor.
  const programme = programmes[0] ?? 'masters';
  return programmePrediction({
    programme,
    roleType: args.roleType,
    scopeMultiplier: args.scopeMultiplier,
    isInternship: args.isInternship,
    comp: args.single,
  });
}

/** Prediction for ONE programme against ITS OWN floor. */
function programmePrediction(args: {
  programme: Programme;
  roleType: RoleType;
  scopeMultiplier: number;
  isInternship: boolean;
  comp: CompTriple;
}): Prediction {
  const baseFloor = floorPaiseFor(args.programme, args.roleType);
  const floorPaise = Math.round(baseFloor * args.scopeMultiplier);
  const ceilingPaise = Math.round(floorPaise * 1.6);
  const per = args.isInternship ? ' / month' : ' / annum';
  const progLabel = args.programme === 'masters' ? 'M.Des' : 'B.Des';
  const rangeLabel = `${rupees(floorPaise)} – ${rupees(ceilingPaise)}${per}`;

  const offered = lowestOfferedFor(args.isInternship, args.comp);

  if (offered === undefined) {
    return {
      floorPaise,
      rangeLabel,
      note: 'Enter compensation to see how it compares against the floor.',
      severity: 'ok',
      blocks: false,
      blockMessage: '',
    };
  }
  // Below floor → BLOCKS (mirrors the server's `offered < adjustedFloor`).
  // The 0.9 split only chooses the message tone: "well below" vs "just under".
  if (offered < floorPaise * 0.9) {
    return {
      floorPaise,
      rangeLabel,
      note: `The ${progLabel} figure (${rupees(offered)}) is well below its floor of ${rupees(floorPaise)}.`,
      severity: 'severe',
      blocks: true,
      blockMessage: `${progLabel} compensation is well below its floor for this role (${rupees(floorPaise)}). Raise it before submitting.`,
    };
  }
  if (offered < floorPaise) {
    return {
      floorPaise,
      rangeLabel,
      note: `The ${progLabel} figure (${rupees(offered)}) is just under its ${rupees(floorPaise)} floor — raise it to clear the floor before submitting.`,
      severity: 'mild',
      blocks: true,
      blockMessage: `${progLabel} compensation is below its floor for this role (${rupees(floorPaise)}). Raise it to clear the floor before submitting.`,
    };
  }
  return {
    floorPaise,
    rangeLabel,
    note: `Looks healthy — ${progLabel} clears its ${rupees(floorPaise)} floor.`,
    severity: 'ok',
    blocks: false,
    blockMessage: '',
  };
}

const SEVERITY_RANK: Record<PredictionSeverity, number> = { ok: 0, mild: 1, severe: 2 };

/** The more-binding of two predictions: higher severity wins; ties → higher floor. */
function worsePrediction(a: Prediction, b: Prediction): Prediction {
  if (SEVERITY_RANK[b.severity] > SEVERITY_RANK[a.severity]) return b;
  if (SEVERITY_RANK[b.severity] < SEVERITY_RANK[a.severity]) return a;
  return b.floorPaise > a.floorPaise ? b : a;
}

/** Lowest offered paise across a single compensation triple. */
function lowestOfferedFor(isInternship: boolean, comp: CompTriple): number | undefined {
  const vals: number[] = [];
  const push = (s: string) => {
    const p = rupeesToPaise(s);
    if (p !== undefined) vals.push(p);
  };
  if (isInternship) push(comp.stipend);
  else {
    push(comp.baseMin);
    push(comp.baseMax);
  }
  return vals.length > 0 ? Math.min(...vals) : undefined;
}

// ── styles ───────────────────────────────────────────────────────────────────

const layoutGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 260px',
  gap: 'var(--space-6)',
  alignItems: 'start',
};

const asideStyle: CSSProperties = {
  display: 'block',
};

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

const miniHeading = {
  fontSize: 'var(--fs-12)',
  fontWeight: 'var(--fw-600)',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-1)',
} as const;

const miniList = {
  margin: 0,
  paddingLeft: 'var(--space-5)',
  display: 'grid',
  gap: 'var(--space-1)',
  fontSize: 'var(--fs-13, 13px)',
  color: 'var(--text-primary)',
  lineHeight: 1.4,
} as const;
