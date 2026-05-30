# CONTEXT.md — jd-posting module knowledge

> Read after [[AGENTS.md]].

## Why this module exists separately

JD posting is its own workflow with a distinct lifecycle (draft → moderation → published, immutable thereafter), its own validation surface (the structured schema), and its own gate (stipend floor, later + AI analyzer). It is authored by recruiters but governed by the institution. Isolating it keeps the authoring UX, the schema, and the gate in one place.

## The structured JD schema ("ATS-for-JDs")

Per Phase 4.2, recruiters do not write free-form JDs. They fill named fields:

- **Role basics:** title, role-type (full-time / vacation-internship / during-course-internship), location, work-mode, positions, optional target start date.
- **Compensation:** for full-time, a base salary RANGE (min + max) plus optional variable / equity / joining-bonus / relocation; for internships, a single stipend. All in paise. When BOTH programmes are targeted (Round 2 §N), compensation is captured PER programme in `programmeCompensation.{bachelors,masters}`; the moderation schema additionally enforces M.Des ≥ B.Des at both endpoints.
- **Skills:** multi-select from a canonical taxonomy, each tagged required or preferred. Free-text fallback is allowed but flagged (admin review later).
- **Responsibilities:** categorized into Discovery / Definition / Design / Delivery / Ops, each a list of bullet lines. The categorization lets the future analyzer map effort distribution to compensation.
- **Deliverables + success criteria:** short explicit list.
- **Supplementary prose:** optional markdown narrative; the structured fields above are authoritative.
- **Interview rounds:** count + per-round focus, declared at posting time (Phase 1.5 — visible to students before they apply).

## GP fee

For internships, a ₹5,000-per-intake GP fee is acknowledged at posting (Phase 4.18). It is invoiced to the recruiter at intake, never deducted from the student stipend. In this slice we capture the acknowledgement; the invoicing wires up when the payment module lands.

## Demo recruiter (no auth yet)

The recruiter portal is scoped to a fixed demo recruiter — **Acme Design Studio (NID-2026-A-0001)**, which is in `credentials-issued` state from the onboarding module's seed. A visible "acting as" banner notes that auth lands in a later module. When auth ships, the recruiter id comes from the session instead of the hardcoded constant.

## Status lifecycle

| Status | Editable? | How it moves |
|---|---|---|
| `draft` | Yes | Recruiter saves a draft; can keep editing |
| `in-moderation` | No (frozen) | Recruiter submits; passes the pre-publish gate |
| `published` | No (frozen) | Admin moderation approves (later slice) |
| `closed` | No | JD cycle ends |
| `withdrawn` | No | JD-withdrawal flow (later slice) |

## Gate ordering

`submitForModeration` runs the gate before persisting the status change:
1. Schema completeness (Zod) — all required fields present.
2. Stipend-floor compliance (deterministic, `@nid/core`) — see the per-programme rule below.
3. (Later) AI scope-creep classification + discipline-mapping confirmation.

If the gate fails, the JD stays in `draft` and the caller gets the failure detail to render.

## Stipend-floor gate — per programme, against its OWN floor (Round 2 §N)

The single most error-prone invariant in this module: **each targeted programme is gated against its own floor.**

- `evaluateProgrammeFloors` (in `actions.ts`) is the ONE place that decides floor compliance. It maps each targeted programme to `floorPaiseFor(programme, roleType) × scopeMultiplier` and runs `checkStipendFloor` for it. In split (both-programmes) mode the per-programme `programmeCompensation` slice is authoritative; single-programme JDs use the top-level comp fields. The gate **fails if ANY programme is below its own floor.**
- Both `runStipendGate` (the submit gate) and `buildGateReport` (the admin transparency report, which also fills `perProgramme`) go through this helper — they cannot disagree.
- The wizard mirrors M.Des onto the top-level comp fields for display only (list cards / legacy single-value surfaces). It is **NOT** read by the gate in split mode — do not make the gate depend on the mirror.
- The client predictor in `apps/web/.../JdWizard.tsx` mirrors this exactly: per-programme floors, and it **blocks submit at the same boundary the server uses (`offered < adjustedFloor`)** — the mild/severe split is message tone only, never the block boundary. If you change one side, change the other.
- Regression test: `test/stipend-split.test.ts` (B.Des-below-floor blocks; valid B.Des-near-its-own-floor passes; single-programme still gates). Run `pnpm --filter @nid/module-jd-posting test`.

## One unpaid evaluative task per JD (take-home XOR whiteboarding)

A JD may impose **at most one** unpaid evaluative task: a required **take-home** (`evaluationTask.required === true`) OR a **live whiteboarding round** (any interview round with `liveExercise === true`) — never both. Each is a project's worth of work students do without compensation, so the institution caps it at one ("values over money").

- Enforced in `jdModerationSchema.superRefine` (path `evaluationTask`). Drafts stay permissive (you just can't *submit* both).
- Mirrored client-side in the wizard: a live warning + a submit block when both are set, so the recruiter fixes it before the round-trip (same defense-in-depth pattern as the floor gate).
- `interviewRoundSchema` carries `liveExercise: boolean` (default false). Seeded JDs set it explicitly false.
- Regression test: `test/assessment-exclusivity.test.ts`.

Read [[REFERENCES.md]] next.
