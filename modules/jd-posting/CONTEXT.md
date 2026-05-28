# CONTEXT.md — jd-posting module knowledge

> Read after [[AGENTS.md]].

## Why this module exists separately

JD posting is its own workflow with a distinct lifecycle (draft → moderation → published, immutable thereafter), its own validation surface (the structured schema), and its own gate (stipend floor, later + AI analyzer). It is authored by recruiters but governed by the institution. Isolating it keeps the authoring UX, the schema, and the gate in one place.

## The structured JD schema ("ATS-for-JDs")

Per Phase 4.2, recruiters do not write free-form JDs. They fill named fields:

- **Role basics:** title, role-type (full-time / vacation-internship / during-course-internship), location, work-mode, positions, optional target start date.
- **Compensation:** for full-time, a base salary RANGE (min + max) plus optional variable / equity / joining-bonus / relocation; for internships, a single stipend. All in paise.
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
2. Stipend-floor compliance (deterministic, `@nid/core`).
3. (Later) AI scope-creep classification + discipline-mapping confirmation.

If the gate fails, the JD stays in `draft` and the caller gets the failure detail to render.

Read [[REFERENCES.md]] next.
