# REFERENCES.md — Where to Look

> Pointers to authoritative documents, external systems, and related code locations. Lookup table, not content. Read after [[CONTEXT.md]].

## The plan (authoritative architectural source)

`/Users/tusharkant/.claude/plans/this-is-a-demo-wiggly-parrot.md`

Section index:
- **Phase 1** — Research on NID's current portal, recruiter workflow, peer benchmarks
- **Phase 1.5** — Insights folded in from user review (15+ pivots including project rescope, JD immutability, accountability model)
- **Phase 2** — 9 design principles
- **Phase 3** — Information Architecture
  - 3.1 Domain/subdomain structure
  - 3.2 Public surface sitemap
  - 3.3 Recruiter portal sitemap
  - 3.4 Placement-admin portal sitemap
  - 3.5 Student portal sitemap (light)
  - 3.6 Federation API surface (institution-side + recruiter-side)
  - 3.7 Navigation patterns
- **Phase 4** — 19 recruiter user flows
- **Phase 5** — 15 supporting flows (admin moderation, redressal, blacklist, etc.)
- **Phase 6** — Cross-cutting concerns
  - 6.1 Compliance posture (DPDP, STQC, PFMS)
  - 6.2 Design language parity with `nid.edu` (extracted tokens)
  - 6.2a 3-tier token model
  - 6.2b Ant-Design-inspired animation language
  - 6.2c Nielsen heuristics per surface
  - 6.2d Atomic mobile-first structural building
  - 6.3 Bot & scraping policy
  - 6.4 Asset serving & compression
  - 6.5 Mobile vs desktop primary surfaces
  - 6.6 Migration path from current ASP.NET system
  - 6.7 `portfolio.nid.edu` server-side ingest model
  - 6.8 API governance
  - 6.9 Company health score architecture
  - 6.10 JD schema governance
  - 6.11a ML vs LLM split (self-hosted local LLM for critical workflows)
  - 6.11b Langfuse observability
  - 6.11c Direct-coordination comms (no central meeting-platform integration)
  - 6.12a Engineering principles
  - 6.12b Traffic peak handling
  - 6.12c Resolvable codebase
  - 6.12d Migration sequencing table
  - **6.13 Stack decisions** (unified — language, framework, host, package manager, toolchain)
- **Phase 7** — Acceptance criteria
- **Phase 8** — Deferred + explicitly out-of-scope (with reasons)
- **Phase 9** — Prototype build architecture (the 5-markdown contract, GCC, native harness, post-Phase-1 evaluation)

## Existing NID surfaces we interact with (read-only)

- `nid.edu` — main institutional site (Laravel, PHP 7.1.33). **Source of design tokens** — we mirror its typography, color, voice for parity.
  - Primary CSS: `https://www.nid.edu/public/frontend/css/styles.css` (~52 KB, NID `:root` tokens declared lines 1-18)
  - Responsive overrides: `https://www.nid.edu/public/frontend/css/responsive.css` (~37 KB)
- `industryinterface.nid.edu` — current portal we are replacing. ASP.NET Web Forms. **Do not modify; read for content reference only.**
- `portfolio.nid.edu` — student-portfolio directory. **No per-student pages.** Public AJAX endpoint `POST /home.aspx/fillDetails {"pageIndex":N}` returns 30 cards/page as JSON-wrapped HTML. **Source of our background ingestion pipeline.**
- `youngdesigners.in` — separate student-portfolio initiative. **Secondary ingestion source.**

## External design + tech references

- **shadcn/ui:** `https://ui.shadcn.com/` — our React component foundation
- **Tailwind v4:** `https://tailwindcss.com/docs/v4-beta` — utility CSS engine
- **Next.js 15 App Router:** `https://nextjs.org/docs/app` — framework docs
- **Drizzle ORM:** `https://orm.drizzle.team/` — TS-first ORM
- **shadcn New York theme** — our visual baseline before NID token overrides
- **Material 3 design tokens:** `https://m3.material.io/foundations/design-tokens/overview` — 3-tier model reference (primitives → semantics → components)
- **Ant Design Motion:** `https://ant.design/docs/spec/motion` — easing curves + durations reference for our motion tokens
- **Nielsen Heuristics:** `https://www.nngroup.com/articles/ten-usability-heuristics/` — applied per surface in Phase 6.2c
- **W3C Design Tokens Format:** `https://design-tokens.github.io/community-group/format/` — export format for Figma/Storybook bridge

## Compliance references

- **DPDP Act 2023:** `https://www.meity.gov.in/content/digital-personal-data-protection-act-2023` — data residency, consent, deletion rights
- **STQC certification:** `https://www.stqc.gov.in/` — security headers, audit log retention requirements
- **PFMS:** `https://pfms.nic.in/` — Public Financial Management System; payment compatibility

## Project-local reference files

- `.gcc/session-memory.md` — current state, last accomplishment, next step
- `.gcc/commit.md` — append-only build history
- `.gcc/metadata.yaml` — phase, module, status
- `.gcc/index.yaml` — lean per-commit index
- `.gcc/changelog.md` — context absorption + drift log

## Where things live in the codebase

- `apps/web/` — the Next.js application
- `packages/core/` — pure domain logic (entities, rules, discipline-mapping)
- `packages/core/src/contracts/` — adapter interfaces (auth, payments, comms, storage, AI, analytics)
- `packages/adapters/` — swappable implementations behind those interfaces (created as needed)
- `packages/db/` — Drizzle schema, migrations, seed data
- `packages/ui/` — design system: 3-tier tokens + atoms + molecules + organisms
- `modules/` — feature modules each with their own 5-markdown contract (added per milestone)

## External APIs (when implemented)

- **Razorpay** — payment gateway (PFMS-compatible flow)
- **Resend** — transactional email
- **WhatsApp Business API (BSP)** — 3-party time-sensitive comms
- **Vercel Blob / Supabase Storage** — file storage for PDFs, portfolios

Read [[SKILLS.md]] next.
