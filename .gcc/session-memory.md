---
name: nid-industry-interface-session-memory
project: nid-industry-interface
last_updated: 2026-05-29
status: milestone-2-candidate-browse-complete
current_module: candidate-browse
---

# Session Memory — NID Industry Interface (project-local)

Project-local session memory. Fully isolated from any global GCC layer.

## Last session

**Date:** 2026-05-29
**Phase:** Milestone 2 — Recruiter end-to-end (mock data)
**Latest commit:** `ce04833 feat(milestone-2): candidate browse — portfolio-first, discipline-filtered`

## Milestone 2 progress

1. Slice 1 — recruiter onboarding `/apply` + `/track/<token>` (b945db2)
2. Slice 2 — admin recruiter queue (1811aa9)
3. Slice 3 — JD posting wizard + stipend gate (87ac884)
4. Slice 4 — admin JD moderation + discipline mapping (5148460)
5. Slice 5 (this step) — candidate browse, portfolio-first + guardrails (ce04833)

## What was accomplished this step

1. **`modules/candidate-browse/`** — third module, hand-written 5-markdown contract.
   - 14 seeded students across disciplines; guardrails enforced at the **type level** (sort union = name|discipline|batch only; no bulk-shortlist function; note required to shortlist).
   - `listEligibleCandidates(jd)` = discipline ∈ targetDisciplineIds AND opted into cycle.
   - JSON-backed shortlist store (students are read-only seed).
2. **Recruiter routes:**
   - `/recruiter/jds/[jdId]/applicants` — portfolio-first grid (discipline-colored placeholder tiles until ingest lands), sort tabs (name/discipline/batch), shortlisted badge.
   - `/recruiter/jds/[jdId]/applicants/[studentId]` — detail with external portfolio link-out + IPR note, CV, statement, individual shortlist form (note required) + remove.
   - Published JDs in `/recruiter/jds` link to applicants.
3. **jd-posting seed restructured:** jd_00001 published w/ disciplines [interaction-design, product-design]; jd_00003 in-moderation (admin-queue demo); jd_00002 draft.

## Verified (fresh dev server)

- 7 eligible candidates for jd_00001 (4 Interaction Design + 3 Product Design who opted in).
- All non-target disciplines (Communication, Graphic, Animation) excluded; Dev Menon (Product but NOT opted in) excluded by the opt-in gate.
- Detail renders portfolio link-out + IPR note + required-note shortlist.
- Guardrail grep confirms **no** select-all / cgpa / fit-score / gender / caste / religion / bulk affordances anywhere.

## Key decisions + gotchas captured this step

- **Guardrails are type-level, not just UI.** `CandidateSort = 'name'|'discipline'|'batch'` — a ranking option is unrepresentable. No `shortlistMany`. Note is required. Makes "AI never ranks, recruiters judge individually" unbreakable.
- **IMPORTANT GOTCHA — mock-store data path:** the JSON stores write to `process.cwd()/.dev-data`. Under `pnpm --filter web dev` the Next.js cwd is `apps/web`, so the real data lives at **`apps/web/.dev-data/`**, NOT the repo root. To reset demo data, clear `apps/web/.dev-data` (clearing repo-root `.dev-data` does nothing). Stale `apps/web/.dev-data/jd-posting.json` masked the new seed and cost a debug cycle.
- **Multiple stale `next dev` processes** can linger across sessions and bind :3100 with old code. `pkill -9 -f next` before a clean verify.
- Portfolio tiles are discipline-colored placeholders until the portfolio.nid.edu ingest pipeline lands; the detail links OUT to the external portfolio (no embed), matching portfolio.nid.edu reality.

## Next step (single, specific)

**Slot booking (Phase 4.6)** is the natural next surface (shortlist → invite → book slots). New module `modules/slot-booking/`: admin publishes interview-day slots for the cycle; recruiter books slots for shortlisted candidates; students get assignments. Alternatively the **AI JD analyzer (Python ML worker)** is a good standalone slice to exercise the two-language stack. Ask the user which to prioritize before starting.

## Open blockers

None.

## Session-start protocol reminder

Per Phase 9.3: read this file, ask the user explicitly whether to continue (next: slot booking or AI analyzer) or start fresh; never auto-continue; honor session-bloat detection past ~50K tokens. Remember the `apps/web/.dev-data` path gotcha.
