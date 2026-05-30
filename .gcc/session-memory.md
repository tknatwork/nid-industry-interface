---
name: nid-industry-interface-session-memory
project: nid-industry-interface
last_updated: 2026-05-30
status: Round 4 (linear recruiter workflow) built GREEN on feat/recruiter-linear-workflow — Hybrid IA + stage-gate + interview Before/During/After + offers sequence/letters + dashboard; gate green (tsc 16 · 91 tests · boundaries · contracts · build 67 routes · audit 0); 6-verifier adversarial pass fixed 3 HIGH; PR to open for owner review. (Round 3 PR #2 already MERGED to main 509686d.)
current_module: (Round 4 — linear recruiter workflow pipeline)
---

# Session Memory — NID Industry Interface (project-local)

Project-local session memory. Fully isolated from any global GCC layer.

## Round 4 — linear recruiter workflow (2026-05-30)

**Branch:** `feat/recruiter-linear-workflow` (off merged `main` 509686d). Built via dynamic Workflows: Wave 0 (9 parallel foundation writers) → Wave 1 (4 parallel surface groups) → Wave 2 (6 adversarial verifiers + fix-loop) → Wave 3 docs. Plan: the plan file → "# Round 4".

**What shipped:**
- **Hybrid IA:** Candidates/Interview/Offers tabs are self-contained workspaces (`?jd=` selector via new `apps/web/components/JdWorkspaceSelector.tsx`); JD/candidate detail opens inline in an `Overlay` (no nav → tab never flips). The 6 legacy `/recruiter/jds/[jdId]/{applicants,applicants/[studentId],shortlist,slots,interviews,offers,close}` pages now `redirect()` (after `requireOwnedJd`) into the workspace. New non-throwing `resolveOwnedJd` (workspace reads) vs throwing `requireOwnedJd` (redirects + ALL mutations).
- **NEW `modules/recruiter-pipeline`:** forward-only stage machine (`published→shortlisting→plan-locked→interviewing→tallied→offer-sequencing→letters-out`) + append-only audit log = the "never backwards" + "active log" core.
- **Interview (extend `interview-console`):** Before = `PlanSetupForm` + `LegoTimeline` (@dnd-kit `SortableList`) → lock; During = `DuringRounds` (round-by-round; advancing a round SEALS it); After = `AfterTally` + `LetterDialog` (note + VoiceInput voicenote + StarRating) → `sendLetterAction` flips interviewsComplete + hands to Offers. Plan/letters/round-advance/tally fns + `InterviewPlan` live in interview-console.
- **Offers (extend `offer-cascade` + NEW `modules/offer-letters`):** recruiter-locked float sequence (`SortableList`); per-wave `deadlineIso` + lazy `sweepExpiredOffers` + `autoFloatNext` + simulate control (hard cap untouched); offer-letter PDF (base64) + institute certificate (`certificate.ts` SHA-256 + placeholder QR SVG, ≤2.8MB) + public `/verify/[hash]` + student `StudentLetterViewer`; accepted-students section. Pure rules `nextInSequence`/`isDeadlinePassed`/`minutesToDeadline` in `packages/core`.
- **Dashboard:** per-JD pipelines grid + experience StarRating (sliced into `recruiter-engagement`).
- **New `packages/ui` primitives:** `StarRating`, `FileUpload` (PDF→base64), `SortableList` (@dnd-kit, generic — Lego timeline + offer sequence). Deps `@dnd-kit/{core,sortable,utilities}` on `packages/ui` only.

**Wave 2 adversarial (6 verifiers · 11 findings · boundary/ownership/routing verdict CLEAN):** Fixed **3 HIGH** — (1) `lockSelectionAction` had no server lock after interviews-complete (could rewrite the live offer pool); (2) `recordOutcomeAction` could re-score a SEALED round to un-advance a candidate; (3) `issueOfferAction` trusted client `positions`/`shortlistRemaining` → cap bypass — plus 1 MED (legacy issueOfferAction), 3 LOW (override-pre-lock, `/verify` double-decode 500, shortlistRemaining), 2 INFO-cleanup (deleted orphaned `InterviewTabs.tsx`; `closeJdAction`→workspace). 2 INFO accepted (verify-metadata intended; single-writer JSON store = demo posture). Regression tests: `interview-console/test/linearity-guards.test.ts` (3 cases: round-seal + override-lock).

**GOTCHA (carry forward):** linearity invariants MUST be enforced server-side (store or action), NEVER via the rendered `disabled` — a crafted/replayed server-action POST ignores the UI. Cap-bearing inputs (positions, shortlistRemaining) are derived from the owned JD + module state, never `formData`. Store-level seals (`writeRoundResult` refuses round ≤ advancedThroughRound; `overridePlanAssignment` requires locked) protect all callers.

**Verification (green):** `tsc` 16 projects · vitest **91** (core 48 · offer-letters 9 · recruiter-pipeline 9 · jd-posting 8 · offer-cascade 8 · interview-console 9) · `pnpm boundaries` (16 pkgs) · `check:contracts` (12 modules) · `next build` 67 routes · `pnpm audit --prod` 0. Vercel-safe (@dnd-kit pure-JS; JSON fallback; no DATABASE_URL).

**Next step:** Round 4 built GREEN on `feat/recruiter-linear-workflow`. Commit (Conventional Commits, project-local identity, no co-author trailer) → push → open PR to `main` (branch-protected; OWNER reviews + merges). Owner redeploys `vercel --prod` after merge (prod decoupled from main). Do NOT auto-continue past opening the PR.

## Round 3 — recruiter account lifecycle + multi-branch + repo governance (2026-05-30)

**Branch:** `feat/recruiter-portal-round2`. Built via dynamic multi-agent Workflows (user directed "build using dynamic workflows"). Commits: `e491ef5` (E1+A+B) · `bfc7087` (C) · `cfec101` (D + isolation fixes) · `cdc5461` (E3 deps) · + this docs commit.

> **Plan-mode gotcha (learned):** workflow SUBAGENTS inherit the main session's plan mode — the first Round-3 workflow returned 5 plans + ZERO edits (agents were read-only). Approving the plan (ExitPlanMode) is the ONLY switch from planning→building; a fresh re-run then actually wrote code. If a workflow returns "here is my plan" instead of file changes, you're still in plan mode.

- **E1 governance + A account self-service + B tutorials:** `.github/{CODEOWNERS,PULL_REQUEST_TEMPLATE,ISSUE_TEMPLATE/*,dependabot.yml}` + `CONTRIBUTING.md` + `SECURITY.md`; recruiter **Log Out** (`account-actions.ts` + `RecruiterAccountMenu` + a `RecruiterShell.accountMenu` slot wired into ~20 recruiter pages); **profile editing** (`/recruiter/profile/edit`, email + phone reusing `MobileVerify` with re-verify only on change; `updateContactDetails`/`getCompanyRecord` on recruiter-onboarding); first-time **DashboardTour** (Overlay, localStorage-gated, re-runnable via "Take a tour").
- **C cycle wind-down + account lock:** account-activation state on recruiter-onboarding (`getAccountState`/`isAccountLocked`/`windDownCycle`/`reactivateForCycle`); admin "Wind down current cycle" on `/admin/cycles`; locked recruiter dashboard + `/recruiter/reactivate` re-pay flow (same creds → unlock next cycle). Lock authoritative on writes (guards on submitNewJdAction/saveNewDraftAction/issueOfferAction). Adversarial-passed.
- **D multi-branch companies:** `parentCompanyId`+`branchLabel` on ApplicationTicketRecord; `PARENT_COMPANIES` + a 2nd seeded branch (Acme · Ahmedabad `NID-2026-A-0002`, own GST/creds, no JDs) + dual `DEMO_LOGINS`; apply branch-select; admin queue grouped by parent; profile branch chip; login picker. **Two adversarial passes:** the first caught (1) a client/server BOUNDARY break (branch helpers pulled the onboarding store into client-imported `recruiter-public.ts` → moved to server-only `apps/web/lib/recruiter-branch.ts`) and (2) a HIGH branch-isolation leak (hardcoded `DEMO_RECRUITER` + no JD-ownership checks → Ahmedabad could read/mutate Bengaluru's JDs). Fixed with a shared `requireOwnedJd(jdId)` guard (`apps/web/lib/recruiter-jd-guard.ts`) on every `/recruiter/jds` list + `[jdId]` page + write action (incl. the draft-discard the first pass missed); re-trace confirmed isolation closed.
- **E3 dependency advisories:** `pnpm audit --prod` **25 → 0**. `next` 15.1.0→**15.5.18** (2 critical + 6 high Next CVEs), `drizzle-orm` 0.38.4→0.45.2, `eslint-config-next`→15.5.18, `postcss`→8.5.10 + root `pnpm.overrides.postcss ^8.5.10` (Next's transitive build-time copy). Remaining 7 are dev/build-only (vitest/vite/esbuild/@eslint/plugin-kit) — accepted + documented in `SECURITY.md`. `dependabot.yml` keeps them flowing through reviewed PRs.
- **E2 repo hardening:** `docs/repo-hardening.md` runbook for the OWNER — branch protection (require PR + Code Owner review on `main`, block force-push/deletion), collaborator-write restriction, Dependabot/secret-scanning/push-protection. I authored the runbook; the owner applies the access-control toggles (an agent does NOT change repo access settings).

**~~KNOWN residual~~ RESOLVED (commit `d9f8310`):** the 16 `/recruiter/*` surfaces that still read `DEMO_RECRUITER` for shell **companyName** + per-recruiter config (sub-roles, transport pref, coordinator, API key, draft owner) now read `readRecruiterSession()` (the logged-in branch). Fanned out across 3 subagents, verified centrally (tsc 14 projects · vitest · boundaries · contracts · next build 67 routes). Two sync Server Components → async; the shared `withContext()` draft helper → async. `DEMO_RECRUITER` now survives ONLY in the session/login/demo-data layer (`demo-recruiter.ts`, `recruiter-session.ts`, `recruiter-subroles.ts` data, `login/credentials.ts`, `student/report-company`).

**Demo-posture decision:** durable Postgres KV stays OFF (no DATABASE_URL) — personal-project demo "feel"; wire durability only if the institution adopts.

**Next step (agent done — remaining are OWNER actions):** Round 3 is SHIPPED — `DEMO_RECRUITER` cleanup committed (`d9f8310`), branch pushed to origin, deployed to prod (`vercel --prod` READY at `nid-industry-interface.vercel.app`, JSON-fallback posture). **PR #2** (`feat/recruiter-portal-round2 → main`, MERGEABLE/CLEAN, 9 commits / 178 files) is open to bring `main` current — merging it clears `main`'s 55 dependency advisories + lands governance/CODEOWNERS. OWNER to: (1) merge PR #2; (2) apply the `main` branch ruleset per `docs/repo-hardening.md` §1 — **do NOT tick "Include administrators"** or you lock yourself out of merging your own PRs. Already done (verified read-only): secret scanning + push protection + Dependabot enabled; collaborators = owner-only; Dependabot PR #1 open. Vercel prod is a manual `vercel --prod` (decoupled from `main`). Do NOT auto-continue.

---

## Round 2 — recruiter-portal redesign + Wave 2 adversarial fix-loop (2026-05-30)

**Branch:** `feat/recruiter-portal-round2` (106 changed files — all of Round 2; committed in Wave 3).
**Drove from:** a deep walkthrough of the live app → a punch list across pre-login + post-login surfaces (plan Round 2 §A–S). Built via a dynamic multi-agent Workflow: Wave 0 froze shared contracts, Waves 1/1b fanned out the surfaces, Wave 2 = adversarial verification + fix-loop, Wave 3 = docs + commit.

**What shipped (Waves 0/1/1b):**
- **Pre-login:** nav relabel (Process · Timeline · Disciplines · Contact · Login); nid.edu-style footer; new `Overlay`/`Accordion`/`Tabs`/`Marquee`/`ProgressTracker`/`VoiceInput` atoms; homepage 2-col hero + auto-scrolling `RecruiterLogoWall` (simple-icons); Process guidelines section; Timeline (dual fee ₹15k + ₹5k GP, per-activity start/end, add-to-calendar, academic-calendar overlay, ghost Login); Disciplines→20 (tabbed brochure + bento hover); Contact simplified; **Apply** (asterisks + mock OTP + Token→**Ticket** rename + pay→receipt→track overlay); **Login** + demo session; Resources overlays keep logged-in recruiters in the dashboard.
- **Dashboard:** live `cycle-phase` tag + rolling banner; brochure overlay; in-dashboard contacts (placement head + coordinator); institution-verified strike tag (0/3); profile/"your setup"; Stats+Analytics merge (`/analytics`→`/stats`); JD list side-panel + draft edit/discard; **JD wizard upgrade** — upload→parse→autofill, sticky gamified progress, voice, **split B.Des/M.Des compensation**, salary-predictor nudge, role-type→expected-work, evaluation task.
- **Interview ops:** real per-round outcomes + coordination signals (`interview-console` round-progress store); per-candidate slot interviewers; scoped **student-coordinator** `/admin/coordinator/*` (first RBAC) with recruiter↔coordinator shared-store sync; Interview tab Before/During/After; gated **Offers** (locked until "Done & Dusted") + 3-wave cascade cap.

**Wave 2 — adversarial verification + fix-loop (all confirmed findings fixed):**
- **Split-compensation floor gate (HIGH+MEDIUM+LOW) — the crux.** Client predictor and server gate disagreed in opposite directions. Unified onto ONE invariant — **each programme gated against its OWN floor** — via a shared `evaluateProgrammeFloors` helper (server: `runStipendGate` + `buildGateReport`; admin report gains `perProgramme`) and a per-programme client `computePrediction`/`worsePrediction`. A 2nd re-verify pass caught a subtler gap: the client's `< 0.9×floor` block boundary ≠ the server's `< floor`. Fixed via an explicit `Prediction.blocks` flag — **the client now blocks at exactly the server's boundary**; mild/severe is message tone only. Regression test: `modules/jd-posting/test/stipend-split.test.ts` (4 cases). The M.Des→top-level mirror is now display-only (gate ignores it in split mode).
- **Offers write-lock (§S):** `issueOfferAction` re-checks `getInterviewsComplete(jdId)` server-side (lock authoritative on the write path, not just render).
- **Coordinator RBAC (§Q):** new `apps/web/middleware.ts` confines a coordinator (`NID_DEMO_ADMIN_ROLE=coordinator`) to `/admin/coordinator/*` — a layout can't read the path; middleware can. Reuses `isCoordinator()` (single role source of truth). Documented in `.env.example`.
- **Demo-fidelity:** receipt now queues email **+ SMS**; stale `etaBack` cleared when conflict clears (runningLateMin independent); one slot assignment seeded (`jd_00001`/`slot_0001`/`stu_0005`) so the During-tab sync demo works out of the box; coordinator name aligned to the directory ('Aanya Kulkarni'); footer drops removed `/contact/*` links + "Brochures"; `activeNav` on Timeline/Disciplines; `stats` reads `readRecruiterSession()`.

**Verification (green):** `tsc` 14 projects ✓ · vitest `@nid/core` 29/29 + `@nid/module-jd-posting` 4/4 ✓ · boundaries (14 pkgs) ✓ · contracts (10 modules) ✓ · residual renamed-`token` identifiers 0 ✓ · `next build` 67/67 + Middleware registered ✓. Two re-verify rounds (4 adversarial verifiers each); offers-lock + RBAC + demo-fidelity passed exhaustive tracing; the only blocking finding (client/server boundary) is fixed + numerically reconfirmed.

**GOTCHA (carry forward):** the split-comp floor invariant lives in `evaluateProgrammeFloors` — the client predictor MUST mirror its boundary (`offered < adjustedFloor` blocks). If you touch one side, touch the other; the test pins the server side. New vitest surface: jd-posting now runs `vitest run` (devDep added) — `pnpm -r test` covers both core + jd-posting.

**Next step:** Round 2 + the JD take-home/whiteboarding rule + the durable-KV swap are all committed on `feat/recruiter-portal-round2`. Await the user for push/Vercel deploy or the remaining deferred efforts (auth, SDK packages, Playwright E2E, production FastAPI ML, Langfuse). Do NOT auto-continue.

## Durable demo persistence — Postgres KV store (2026-05-30)

User picked the durable-KV approach (over a full relational remodel) to fix the `/tmp`-JSON single-instance caveat. **Done + verified.**

- **Seam (low-risk, no async ripple):** the 10 module JSON stores stay synchronous + remain the in-instance cache; each `persist()` adds one `syncKv('<store-key>', state)` fire-and-forget write-through into a single `kv_store` table (full state blob per store). `apps/web/instrumentation.ts` → `instrumentation-hydrate.ts` hydrates `/tmp` from `kv_store` on cold start, BEFORE requests are served. Actions/pages unchanged.
- **Edge-safety:** the instrumentation ENTRY only imports the node-only hydrate file inside a `process.env.NEXT_RUNTIME === 'nodejs'` branch — Next inlines NEXT_RUNTIME so the `node:fs` import is dead-code-eliminated from the Edge middleware bundle (the first build attempt failed with `UnhandledSchemeError: node:fs` until this split).
- **`@nid/db` additions:** `kv.ts` (`kvEnabled`/`kvGetAll`/`kvSet`/`syncKv`) exported from the index. Lazy connection (never opens at import), **self-creating `kv_store` table** (raw `CREATE TABLE IF NOT EXISTS` on first use → no migration; a fresh hosted Postgres just needs the URL). All 10 store modules now depend on `@nid/db` (boundary check confirms modules→@nid/db is allowed, no cycle; only `@nid/core` must stay db-free).
- **Gated on `DATABASE_URL`:** unset → every kv fn is a no-op and the stores fall back to JSON (the live demo never breaks). Set → durable + shared across instances.
- **To make the VERCEL demo durable:** provision a hosted Postgres (Supabase/Neon/Vercel marketplace) + set `DATABASE_URL` in the Vercel project env + redeploy. The code + JSON fallback are ready; I can't create the DB account. Locally: `DATABASE_URL=postgres://nid:nid@localhost:5433/nid_industry_interface` against the `nid-pg-throwaway` docker container.
- **Verified:** live KV round-trip through the docker Postgres (table auto-creates, blob round-trips with full fidelity); `next build` green WITH the wired stores AND WITHOUT a DB (fallback path); tsc (14 projects), boundaries, contracts all green.
- **GOTCHA:** write-through is best-effort fire-and-forget (a sync `persist` can't await Postgres); because each write ships the FULL blob, a dropped write self-heals on the next mutation. Fine for a demo; for hard durability, await the write in the action layer.

---

### Prior milestone (2026-05-29) — demo-complete on mock data

## Last session

**Date:** 2026-05-29
**Phase:** 🟢 LIVE ON VERCEL + 3-up playground. Full demo deployed from a public GitHub repo. 11 modules + Python ML worker.
**Latest commit:** `e07a2a9 chore(deploy): vercel.json — web service rooted at apps/web (live on Vercel)`

## 🟢 Live demo (the headline)

- **Live URL:** https://nid-industry-interface.vercel.app
- **3-up playground:** https://nid-industry-interface.vercel.app/playground — recruiter (top, full width) + institution/admin & student (below, side-by-side) in same-origin iframes against ONE live backend. Act in one pane, reload another to see the cross-portal loop (student accepts offer → reload recruiter → wave cascade shows filled 1/2). Server-Action forms post inside the panes.
- **Public repo:** https://github.com/tknatwork/nid-industry-interface (its own repo; only `.env.example` dummies tracked — secret-scanned before going public).

### How the deploy works (read before touching it)
- **Serverless fs fix:** all 10 mock stores write to `/tmp/nid-dev-data` when `process.env['VERCEL']` is set (Vercel fs is read-only except /tmp). State persists within a warm instance + re-seeds on cold start (clean slate per demo session). Single-instance caveat under heavy concurrency — fine for a solo walkthrough; the real-DB swap (Drizzle/KV) is the upgrade.
- `/recruiter`, `/admin`, `/student` have **force-dynamic segment layouts** so pages read live `/tmp` state per request (not a build-time static snapshot).
- `next.config` gates `output:'standalone'` OFF on Vercel + transpiles all 10 modules. `vercel.json` uses `experimentalServices.web.root = apps/web` (pnpm-monorepo app root) — this is what made the build detect Next.
- **Redeploy:** `vercel deploy --prod --yes --scope tushar-kant-naiks-projects` (GitHub auto-connect is NOT set up — Vercel's GitHub app isn't installed on the account; push alone does NOT redeploy. Either run the CLI or install the Vercel GitHub app + set Root Directory = apps/web in the dashboard for push-deploys).
- **CI:** `.github/workflows/ci.yml` is `workflow_dispatch`-only (showcase artifact, not an active pipeline — no auto-runs). The ML Python worker is NOT deployed on Vercel → the JD analyzer uses its graceful deterministic fallback live.
- GitHub Dependabot flags transitive-dep advisories (mock-data demo; informational — ignore or disable in repo settings).

## Latest round — Drizzle Studio (live DB) + federation Phase-2 + editable admin

- **Drizzle Studio runs** against a throwaway Postgres. The launch.json entry failed on two
  counts: no `DATABASE_URL` + a drizzle-kit↔orm mismatch (`singlestore-core` export). Fixes:
  drizzle-orm `0.36.4 → 0.38.4`; `drizzle.config.ts` now `import 'dotenv/config'` → reads
  `packages/db/.env` (gitignored; `.env.example` committed). **Throwaway DB: docker container
  `nid-pg-throwaway`, host port 5433** (Langfuse holds 5432). Bring-up:
  `docker run -d --name nid-pg-throwaway -e POSTGRES_USER=nid -e POSTGRES_PASSWORD=nid -e POSTGRES_DB=nid_industry_interface -p 5433:5432 postgres:16`
  then `pnpm --filter @nid/db exec drizzle-kit migrate && pnpm --filter @nid/db seed` (21 tables,
  seeded). Studio: `preview_start drizzle-studio` → :4983. NOTE: drizzle-kit `push` hangs on its
  TUI prompt under a pipe — use `generate` + `migrate` (non-interactive) instead.
- **Federation Phase-2** (background agent): institution writes `PUT /api/v1/institution/{disciplines,
  coordinators}` + `POST /content-overrides` (x-api-key, Zod) + recruiter `GET /webhooks/events` +
  `POST /webhooks/simulate` → HMAC-SHA256 signed sample (`apps/web/lib/webhooks.ts`, node:crypto).
- **Editable admin** (11th module `@nid/module-admin-cms`): persisted cycle config + 6 CMS content
  blocks. `/admin/cycles` edit form + `/admin/content` editable blocks; edits persist (verified).

GOTCHA (superseded 2026-05-30): module STORES were JSON `.dev-data` only at this point. The
durable Postgres KV swap is now DONE — stores write through to a `kv_store` table when
`DATABASE_URL` is set (see "Durable demo persistence" section near the top).

## Latest round (federation + publishing + a11y + tests)

- **Phase-2 federation APIs** (`apps/web/app/api/**` + `apps/web/lib/federation.ts`, built by a
  background agent): public feeds (cycles.json/.ics, recruiters/past.json), institution read
  (`x-api-key` per-campus) + `POST /announcements`, recruiter **read-only** (`Bearer <keyId>`),
  `/api/v1/openapi.json`. Recruiter bearer is validated against the **live** admin-accountability
  api-keys store → revoked `key_ghost_01` returns 401 (revocable-access guardrail). No student PII /
  no write API on the recruiter side. Demo keys: institution `nid-inst-ahmedabad-demo`; recruiter
  `key_acme_01` (active), `key_ghost_01` (revoked).
- **Admin publishing**: `recruiter-engagement.publishPptWindow` + `publishMeetingSlot`;
  `/admin/engagement` opens PPT windows + meeting slots; `/admin/slots` opens interview slots.
- **A11y**: added `prefers-reduced-motion` to globals.css (skip-link/focus-visible/lang/Devanagari/
  aria/`main#main`/no-zoom-lock were already present).
- **Tests**: vitest in `@nid/core` — 16 unit tests over stipend-floor / health-score / offer-cascade;
  `pnpm -r test` wired into CI. Run with `pnpm --filter @nid/core test`.
- **`.claude/launch.json`**: dev-server configs (web :3100, ml-worker :8000, drizzle-studio :4983 —
  drizzle fails without a live DB). Start via the preview manager / `preview_start`.

GOTCHA reinforced: **Turbopack doesn't hot-register new `app/api/*` route dirs** — restart the web
server (preview_stop + preview_start, or kill+rerun) after adding API routes, else they 404.

## Demo-completeness pass (slices 40–46, after Milestone 4)

User ask: "complete all the parts discussed as per plan … showcase in the demo with all features
functioning" — mock data only, no real DB/auth.

- **Recruiter portal**: zero nav 404s now — `/recruiter/stats` (your-stats-on-return),
  `/candidates` (cross-JD browse), `/interviews` + `/offers` launchers, `/calculator` (+ public
  `/recruiters/calculator`), `/ppt` + `/meetings` (new **recruiter-engagement** module, 9th),
  `/analytics`, `/jds/[id]/close` (4.16 mandatory collective justification + 5.12 withdraw) +
  `/shortlist`.
- **Public site** (3.2): disciplines(+slug) · cycles(+slug) · campuses(+slug) · recruiters hub +
  process/guidelines/faq/past · contact(+coordinators/placement-heads) · reports · `/r/[slug]`
  microsites + `/transparency` (reads REAL anonymised redressal via `transparencyFor`). Seeds in
  `apps/web/lib/{public-content,recruiter-public}.ts`.
- **Admin**: `/admin/cycles` (+ discipline-exposure equity) · `/content` · `/offer-adjustments`
  (5.14) · `/api-keys` (5.9) · `/student-conduct` (5.10).
- **Student**: `/report-company` (files into the admin redressal queue — verified 2→3 cross-portal),
  `/conduct` (+appeal) · `/coordinator` · `/profile` · `/feedback`.

**Parallel-agent pattern (slices 44–46):** main agent built the shared foundation first (extend
admin-accountability with fileRedressal/transparencyFor/conduct/adjustments/api-keys + both shell
navs) and committed it, THEN dispatched 3 general-purpose agents on DISJOINT route trees (public /
admin / student). Agents created only new page files — no module/shell/package.json edits, no git
commits, no installs. Main verified together (typecheck/boundaries/contracts/lint + 22 routes 200 +
the cross-portal loop) and committed. Reuse this for future broad page builds; it avoided all
shared-file conflicts.

## Admin accountability (Task 39) — the loop that makes guardrails enforceable

`modules/admin-accountability` (8th module, depends on `@nid/core` only). Composes the pure
health-score math with persisted events + adjudication state.

- **Score is derived, never stored:** clean recruiter = **70 baseline** ("good"); events adjust via
  core `computeHealthScore` + `bandFromScore`. (The baseline reconciles core's delta-sum with the
  0–100 band scale — it lives in the module's `actions.ts`, not core.)
- **THE loop:** `decideRedressal` sets the case status AND appends a `HealthEvent` in the same action
  → the company's score recomputes → band can drop. Verified: upholding Pixel Forge's stipend case
  moved it **42 (watch) → 27 (restricted)** on both surfaces, then reset to seed.
- Surfaces: `/admin/health-scores` (worst-first + band distribution) + `[recruiterId]` ledger;
  `/admin/redressal` queue + `[caseId]` decide; `/admin/blacklist` add/lift (logged, cooldown, never
  deleted); `/admin/payment-cell` refund/dispute. AdminShell nav gained blacklist + payment-cell
  (the pre-existing health-scores/redressal nav links resolved to 404 before this).
- Seed spans all 5 bands: Acme excellent · Bauhaus good · Pixel Forge watch · GhostCorp blacklisted.

## AI JD analyzer (Task 37) — the first cross-language seam

`services/ml-jd-analyzer/` is a **Python** worker (stdlib `http.server`, zero-install; FastAPI/Pydantic
is the documented production swap). It classifies JD scope creep from structured fields and returns a
**graduated** multiplier (×1.3–1.7) + flagged skills + rationale — richer than the legacy binary 1.0/1.4.

- `@nid/core` gained a types-only `JdScopeAnalyzer` port. `modules/jd-posting/src/scope-analyzer.ts`
  implements it over HTTP: `fetch` + 1.5s `AbortController` timeout + Zod-validate the response +
  **graceful fallback** to the deterministic 1.0/1.4 heuristic when the worker is down.
- **Submit gate stays deterministic** (JD posting never hard-depends on the worker). The **admin
  moderation view** (`/admin/jds/[jdId]`) runs `gateReportForAsync` → shows source (ML analyzer /
  fallback), multiplier, flagged skills, rationale.
- Seed `jd_00004` "Product Designer (frontend-heavy)" bundles 3 dev skills + delivery → ×1.6 → adjusted
  floor ₹9.6L, offered low ₹8L → **below floor**. Verified: worker-up shows ML ×1.6; worker-down falls
  back to ×1.4; both HTTP 200 (no crash).
- Run the worker: `cd services/ml-jd-analyzer && python3 app.py` (PORT 8000). `ML_WORKER_URL` overrides.

## What just landed — the student portal de-fakes the offer loop

`modules/student-portal` (7th module). The headline: the recruiter offers page used to fake
student accept/decline with demo buttons. Now the **student** accepts/declines in their own
`/student/offers` inbox, routed through `offer-cascade.recordResponse`, which drives the real
wave cascade. Verified end-to-end: outstanding 1 → filled 1/2 on the recruiter board, then
reset to the pending seed.

Module design:
- **Owns only per-cycle opt-in** (mutable JSON store). Profile + eligible-JD feed are read
  models composed from candidate-browse (`getCandidate`) + jd-posting (`listJdsByStatus`).
- **Dependency direction:** student-portal → {candidate-browse, jd-posting}. Downstream, acyclic.
- **Composition root = the page** (`/student/applications` stitches shortlist + slot + offer),
  mirroring the recruiter offers page. Keeps module deps to two.
- Routes: `/student` (dashboard), `/student/cycles` (opt-in toggle), `/student/jds` (eligible
  feed), `/student/applications` (tracker), `/student/offers` (real inbox).
- `StudentShell` atom (4th shell) + `apps/web/lib/demo-student.ts` (stu_0005, Aanya Roy) +
  `apps/web/lib/money.ts`. Landing now has a prototype-surfaces strip linking all three portals.

Seed coherence for stu_0005 across three stores: candidate-browse shortlist + offer-cascade
pending Wave-1 offer (₹12L) + student-portal opt-in. So the inbox lands populated.

## Full demo now runnable end-to-end

```
/apply → token tracker → admin issues credentials
  → recruiter posts JD (stipend gate) → admin moderates → published
  → recruiter browses (discipline-filtered, individual shortlist) → books slots → interview console
  → recruiter issues wave offer
  → STUDENT opts in → sees eligible feed → tracks application → ACCEPTS offer in /student/offers
  → recruiter offer board reflects filled 1/2  ← the loop is now real on both sides
```

## Modules built (7)

recruiter-onboarding · jd-posting · candidate-browse · slot-booking · interview-console ·
offer-cascade · student-portal. Each has a hand-written 5-markdown contract. UI atoms: Button,
StatusPill, Field, PageShell, AdminShell, RecruiterShell, StudentShell.

## Verified this session

- `pnpm -r typecheck` clean across all 12 workspace projects (strict + exactOptionalPropertyTypes + noUnusedLocals).
- All `/student/*` routes + `/recruiter/jds/jd_00001/offers` + landing return 200.
- Real accept path (`recordResponse`) drives the cascade; both student + recruiter surfaces reflect it.

## Key decisions + gotchas (carry forward)

- **`exactOptionalPropertyTypes`:** declare optional fields `field?: T | undefined`; spread optionals conditionally. Applies to every new module + page.
- **`z.coerce.boolean('false')` is truthy** — convert form strings to real booleans in the action before the schema (done in `/student/cycles/actions.ts`).
- **node-using modules extend `tsconfig.node.json`** so standalone `tsc` resolves `node:fs`.
- **Mock JSON stores live at `apps/web/.dev-data/`** (cwd-based). Clear ALL of them together to reset — clearing one desyncs the seed coherence (3 stores reference stu_0005).
- **Kill stale `next dev` (`pkill -9 -f next`) before a clean verify**; restart to register new `app/api/*` route dirs (Turbopack).
- **Relative imports omit `.js`** (Turbopack resolves TS workspace source literally).
- **Documented seam:** student-portal opt-in is NOT yet unified with recruiter-side candidate-browse opt-in (candidate-browse reads its own seed). Unify at the `@nid/db` layer. Not a bug — intentional for the slice.
- **Git convention (project-local, isolated):** `git -c commit.gpgsign=false -c user.email='build@nid-industry-interface.local' -c user.name='NID Industry Interface Build'`. Conventional Commits. No Claude co-author trailer (matches the existing history + isolation mandate).

## Native harness (Task 38) — runnable, lean

- `pnpm boundaries` = `scripts/check-boundaries.mjs` (dependency-free Node). dependency-cruiser
  can't resolve TS under pnpm's isolated layout (JS-only parser → "Unexpected token '*'"), so the
  runnable check is this script: no cross-module internal imports (public `@nid/*` only), core
  purity, no circular `@nid/*` deps. Negative-tested (planted violations → exit 1).
  `boundaries:depcruise` kept as a documented fallback for TS-resolvable CI.
- `pnpm check:contracts` = every `modules/*` has all 5 non-empty markdown contracts.
- `pnpm lint:ws` = root ESLint flat config (`no-explicit-any`, `consistent-type-imports`) over
  modules + packages; apps/web keeps `next lint`. Clean at error severity.
- `pnpm harness` = boundaries && check:contracts && typecheck (hook-facing, dependency-light).
- `.github/workflows/ci.yml` — static `run:` steps only (no `${{ }}` → shell), clears the
  command-injection scanner that blocked the earlier attempt. `lefthook.yml` is opt-in (no auto-install).

## Next step — slices 36–53 done; remaining are the larger/heavier efforts. Ask the user.

Done: whole 4-portal demo · federation read APIs + Phase-2 writes + HMAC webhooks · admin
publishing + editable cycle/content admin · a11y · vitest (16) · live Postgres + Drizzle Studio.
**Do not auto-continue** (Phase 9.3). The genuinely-remaining items are bigger and were deliberately
NOT rushed:

1. **Full Postgres-backed store swap** — migrate the module JSON `.dev-data` stores to the live
   Drizzle/Postgres (DB + 21 tables already exist + seeded). This is a per-module migration across
   all 11 modules — substantial; do it module-by-module with verification, not wholesale.
2. **Auth / SSO** — replace the demo-recruiter/demo-student constants with a real session; gate the
   portals. Large.
3. **SDK packages** — `@nid/industry-embed` (React/Vue/vanilla widget) + `@nid/industry-recruiter-sdk`
   (typed client over the federation API). New workspace packages.
4. **Browser E2E** — Playwright over the 5 critical recruiter paths (needs browser install).
5. **Production ML** — swap stdlib `services/ml-jd-analyzer` → FastAPI + Pydantic + ruff/mypy (pip install).
6. **Langfuse** wiring on the AIProvider adapter; wire the lefthook hooks locally.

Each is a focused effort on its own; I deferred them rather than risk destabilizing the verified demo
in one batch. Pick one and I'll do it with proper care.

## How to run the full demo

- `pnpm --filter web dev` → http://localhost:3100 (landing has a "prototype surfaces" strip linking
  all three portals). Reset demo data with `rm -f apps/web/.dev-data/*.json`.
- Optional: `cd services/ml-jd-analyzer && python3 app.py` (PORT 8000) for the live ML scope analyzer
  at `/admin/jds/jd_00004`; without it, that surface falls back to the deterministic heuristic.

## Session-start protocol reminder

Per Phase 9.3: read this file, ask the user explicitly whether to continue (and which direction)
or start fresh; never auto-continue; honor session-bloat detection past ~50K tokens. Mind the
`apps/web/.dev-data` reset-all, stale-dev-server, exactOptionalPropertyTypes, and
z.coerce.boolean gotchas.
