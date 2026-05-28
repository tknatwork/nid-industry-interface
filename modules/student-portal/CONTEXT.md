# CONTEXT.md — student-portal knowledge

## Entities involved

- **StudentProfile** — projection of candidate-browse's `CandidateView` (no recruiter-only framing). Carries discipline + programme, which drive eligibility.
- **EligibleJd** — projection of a published `JdRecord` for the student's feed, with a resolved `companyName`.
- **Opt-in record** — `${studentId}::${cycleId} → true`. The only owned, mutable state.

## Invariants

1. **Opt-in gates the feed.** `listEligibleJds` returns `[]` unless the student is opted into the cycle. Opting out empties the student's own feed immediately.
2. **Eligibility is the recruiter-side rule, mirrored.** discipline ∈ `targetDisciplineIds` AND programme ∈ `targetProgrammes` AND `status === 'published'` AND opted-in. No other axis. No ranking.
3. **The offer inbox is the source of *student* truth, offer-cascade is the source of *offer* truth.** Accept/decline always routes through `recordResponse`; this module never mutates an `OfferRecord`.
4. **One demo student.** `stu_0005` (Aanya Roy, Product Design, masters) is the acting student until auth lands.

## Decisions already made

- **Composition root = the page.** The application tracker (shortlist + slot + offer per JD) is composed in `apps/web/app/student/applications/page.tsx`, mirroring how the recruiter offers page composes modules. Keeps this module's upstream deps to two (candidate-browse, jd-posting).
- **Company name is a documented local map.** `COMPANY_NAMES` names the seeded recruiter; falls back to the raw `recruiterId`. Replaced by a `jd.recruiter_id → recruiter.company_name` join when the DB lands. Owner of company identity is recruiter-onboarding, not this module.

## Gotchas / documented seams

- **Opt-in is NOT yet unified with recruiter-side browse.** candidate-browse reads opt-in from its own seed array; this store is authoritative only for the student's own feed. A student opting out here will still appear in recruiter browse until both read one `@nid/db` source. This is intentional for the slice, not a bug — see the store header.
- **jd_00001 targets `masters`.** Aanya is masters → eligible. A bachelors demo student would see an empty feed against the current seed; that is correct behavior, not a failure.
- Seeded data is consistent across three stores: candidate-browse (shortlist), offer-cascade (pending offer), student-portal (opt-in). Clearing one `.dev-data/*.json` without the others can desync the demo — clear all of `apps/web/.dev-data/` to reset cleanly.

## Audit-log fields this module will emit (when the audit adapter lands)

`module: 'student-portal'`, `action: 'cycle.opt-in' | 'cycle.opt-out' | 'offer.responded'`, `actorType: 'student'`, `actorId: studentId`, plus `cycleId` / `jdId` / `decision` as relevant.
