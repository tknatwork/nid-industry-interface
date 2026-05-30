# Changelog

Notable changes to the NID Industry Interface **prototype**. This is a rolling
demo on mock data — there are no versioned releases (see `SECURITY.md`), so
entries are grouped by date. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## 2026-05-30

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
