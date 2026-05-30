# Changelog

Notable changes to the NID Industry Interface **prototype**. This is a rolling
demo on mock data — there are no versioned releases (see `SECURITY.md`), so
entries are grouped by date. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## 2026-05-30 — Round 4: linear recruiter workflow

The recruiter portal becomes a strictly linear, no-backwards pipeline
(Dashboard → JD → Candidates → Interview → Offers).

### Added

- **Hybrid IA workspaces.** The Candidates / Interview / Offers tabs are now
  self-contained workspaces with a JD selector; JD and candidate detail open
  inline in a drawer instead of navigating, so the active tab never switches.
  Legacy per-JD routes redirect into the matching workspace. Fixes the
  tab-switch bug where viewing JD content from the Interview tab flipped to "JDs".
- **Forward-only pipeline + activity log.** A stage machine (`published →
  shortlisting → plan-locked → interviewing → tallied → offer-sequencing →
  letters-out`) makes each completed stage read-only, with an append-only audit
  log; day-of interview changes layer on top of the locked plan.
- **Interview Before / During / After.** Before: a "Prepare interview plan" setup
  (duration, rounds, interviewers per round) feeding a drag-and-drop timeline that
  locks before interviews start. During: round-by-round scoring where advancing a
  round seals it and surfaces only advancers in the next. After: a score tally,
  candidate selection (may exceed vacancies), an optional letter-to-students
  (note + voicenote) and a recruiter star rating.
- **Offers sequencing + letters.** The recruiter sets a locked float order;
  offers float in that order with per-wave deadlines and auto-float on
  decline/timeout, never exceeding the vacancy count. A per-JD offer-letter PDF
  upload auto-attaches an institute certificate of authenticity (SHA-256 +
  verification glyph + timestamp), verifiable at a public `/verify/<hash>` page;
  the student sees the letter + certificate badge. An accepted-students section
  lists locked vacancies.
- **Dashboard pipelines.** A per-JD status grid (shortlisted / interview stage /
  offers filled-vs-positions) plus a recruiter experience star-rating.

### Security

- Linear invariants are enforced **server-side** (the UI `disabled` state is never
  the only lock): the After selection freezes once interviews complete; a round
  advanced past cannot be re-scored to un-advance a candidate; offer issuance
  derives the vacancy cap and shortlist count on the server (never client-supplied),
  preserving the hard `outstanding + accepted ≤ positions` cap. The public
  `/verify` page exposes only authenticity metadata, never the PDF. Found and
  fixed via a six-verifier adversarial pass.

## 2026-05-30 — Round 2 + Round 3

The Round 2 redesign and the Round 3 account-lifecycle + governance work land on
`main` together.

### Added

- **Recruiter portal redesign (Round 2).** Reworked pre-login surfaces
  (homepage recruiter logo wall, Process, Timeline with both cycle fees and
  per-activity add-to-calendar, a 20-discipline brochure, simplified Contact,
  Apply → ticket → mock payment → tracker, Login + demo session) and the
  post-login dashboard (live cycle-phase tag, rolling deadline banner, campus
  contacts, JD wizard with upload-to-autofill, a three-phase interview tab, and
  gated wave-based offers).
- **Account self-service (Round 3).** Log Out; profile editing for corporate
  email and phone number, with mock-OTP re-verification required only when the
  number changes; a re-runnable first-run dashboard tour.
- **Cycle wind-down + account locking (Round 3).** A recruiter's dashboard locks
  between placement cycles; reactivation re-pays the participation fee (mock) and
  keeps the same credentials — no re-application.
- **Multi-branch companies (Round 3).** One brand can run several branch
  accounts, each isolated with its own GST number, registration number, contact,
  credentials, and dashboard. The placement cell sees branches grouped under the
  parent company; recruiters only ever see their own branch's data.
- **Repo governance.** `CODEOWNERS`, `CONTRIBUTING.md`, issue/PR templates,
  `SECURITY.md`, and `dependabot.yml`, plus a contribution channel for outside
  proposals (fork → PR → owner review). A `docs/repo-hardening.md` runbook
  documents the owner-applied branch-protection settings.
- **Durable state seam.** Optional Postgres KV write-through with cold-start
  hydration behind `DATABASE_URL`, falling back to local JSON so the demo runs
  with no database.

### Changed

- **JD assessment rule.** A company may require **either** a take-home assignment
  **or** interview whiteboarding for a given JD — never both — to protect students
  from doing two projects' worth of unpaid work.
- Recruiter surfaces now resolve the logged-in branch from the session rather than
  a hardcoded demo identity, so each branch sees its own company name and data.

### Security

- Cleared all **runtime** dependency advisories (25 → 0): Next.js 15.5.18,
  drizzle-orm 0.45.2, and a `postcss ≥ 8.5.10` override. The remaining advisories
  are dev/build-only and are documented as accepted in `SECURITY.md`.
- Enabled secret scanning, push protection, and Dependabot security updates;
  Dependabot now opens grouped dependency PRs through the reviewed channel.
- Hardened branch-level JD ownership: every JD detail page and write action
  asserts the session recruiter owns the JD (404s across branches).
