# CONTEXT.md — What You Need to Know to Work on This Project

> Domain knowledge, key decisions, and gotchas specific to this repository. Read this after [[CLAUDE.md]] and [[AGENTS.md]].

## Domain in one paragraph

NID's Industry Interface is the bi-annual placement portal where companies (recruiters) post job descriptions targeting NID's design disciplines, browse student portfolios, conduct interviews, and issue offers. The Placement Cell (admin staff + faculty + student coordinators) mediates the entire flow: vetting recruiters, moderating JDs, publishing slot calendars, adjudicating payment disputes, brokering pay-differential changes, and coordinating during interview windows. The student side is opt-in per cycle and portfolio-driven.

## Stakeholders (who touches the system)

- **Recruiters** — companies hiring NID graduates. Get a token-tracked application + portal access after admin approval. See: 19 user flows in Phase 4 of the plan.
- **Placement-cell admin** — Asst. Registrar + Placement Head per campus (rotating role, long cadence). Handle vetting, JD moderation, health-score events, payment-cell decisions, content blocks. See Phase 3.4 admin sitemap.
- **Student coordinators** — student-body members assigned per company. Handle WhatsApp groups, onboarding, mid-interview pings. Get scoped admin views; do NOT see recruiter contact details.
- **Students** — opt in per cycle, browse eligible JDs, apply, attend interviews, accept/decline offers. See Phase 3.5 light student sitemap.

## What the current `industryinterface.nid.edu` system actually does (current reality)

The existing system is ASP.NET Web Forms on IIS / Plesk Windows hosted in Hetzner Frankfurt. Key reality checks from audit:
- **Cycle dates are hand-edited HTML strings** — a stale "11th May, 2025" still lives next to fresh 2026 dates on `/login.aspx`. There is no cycle config table.
- **Registration begins as email to `placement@nid.edu`** — the 8-step "Register" card on the homepage is aspirational. Real onboarding: recruiter emails admin, admin vets, admin manually issues credentials.
- **Past-recruiter wall is 54 hand-uploaded PNGs.** Title is "Major Recruiters" — admin curates, doesn't auto-include.
- **Contact info is scattered** across page footers: `industryinterface@nid.edu` (6×), `placement@nid.edu` (FAQ only), phone + Asst. Registrar Sujitha Nair (every footer).
- **Three previously-invisible admin responsibilities surfaced** in the audit: credential issuance, payment-cell adjudication, pay-differential brokering. All three need first-class admin surfaces in our redesign.

## What we are NOT building

Out-of-scope items (per Phase 8.2 of the plan):
- Per-portal pages for the 4 bachelor-only campuses (Vijayawada, Bhopal, Jorhat, Kurukshetra) — they build their own portals on our APIs.
- Foreign students, returning-after-gap students, PhD-specific flows.
- Government / DPIIT / UGC auditor surfaces.
- Alumni-recruiter linkage, parents visibility, industry mentor flows.
- Strategic cycle planning, admin onboarding tutorials.
- International tax / TDS handling (Indian recruiters only).
- Emergency cancellation flows (remote interviews post-COVID).
- Inter-campus vacancy delegation (handled via email today).
- In-portal salary negotiation.
- Counter-offer handling.
- JD edit after publish (replaced by immutability + replacement-JD chain).
- Refund of participation fee (non-refundable).
- Individual per-student rejection feedback as mandatory.
- Cross-cycle individual-student search for admin (equity concern).
- AI-based candidate ranking, fit-scoring, or recommendation.
- Bulk shortlisting (forces individual evaluation).
- Demographic sorting/filtering on recruiter side.
- Joining-document collection (company-side responsibility).
- Recruiter-supplied offer letter templates (recruiters supply own).
- Stipend-composition tracking (just total, not composition).
- Public marketing of individual student placements.
- Notification batching / digest mode.
- OAuth-via-`nid.edu` for recruiters (SSO is student-side only).
- Offline / PWA mode for the interview console.
- Read replicas (over-engineering at institutional scale).
- Central meeting-platform API integration.

## Core architectural invariants

Hold these in mind on every change:

1. **Project isolation.** The project lives entirely in this folder. No state propagates to or from any global config.
2. **Modular monolith first.** Phase 1 ships as a single Next.js app with strict module boundaries. Microservice extraction is a Phase-2 decision artifact based on measured triggers.
3. **Two languages, clean contract.** TypeScript on the web, Python on ML/LLM workers, HTTP with Zod ↔ Pydantic at the boundary.
4. **JDs are immutable after publish.** Any change = new JD with `replaces_jd_id` pointing at the original.
5. **Offer cascade is wave-based.** Strict 1:1 to position count, time-bounded windows (default 7 days), no buffer escape valve.
6. **AI never ranks humans.** AI APIs touching student data are sandboxed to summarize/translate/explain/draft.
7. **No bulk actions on shortlisting.** Each student is individually evaluated with a recruiter note required.
8. **Cycle-native everything.** Discipline taxonomy, eligibility rules, comms templates, fees, deadlines — all per-cycle, all in the DB, all admin-editable.
9. **Audit-log emission is mandatory** on every mutation.
10. **Compliance posture from day one.** DPDP Act 2023, STQC, PFMS-compatible payments, GST invoicing with hash-QR receipts.

## Key flows to keep in mind

When working on UI: Phase 4 flows 4.1–4.19 are the recruiter user flows. The flows users care about most:
- 4.1 First-time recruiter onboarding (token tracker)
- 4.2 Posting a JD (Workday upload → structured fields → CI-pipeline checks → immutable publish)
- 4.4 Browsing candidates (portfolio-first, individual-only)
- 4.7 Interview-day mobile console (transport-selectable, 90-second sandboxed demo)
- 4.8 Offer wave cascade
- 4.14 Your-stats-on-return
- 4.16 Rejection-with-justification
- 4.17 Cross-interview conflict awareness
- 4.18 GP fee bundling at intake
- 4.19 First-time guided tour

## Naming conventions

- **TypeScript:** PascalCase for types and components; camelCase for functions and variables; SCREAMING_SNAKE for constants.
- **Files:** kebab-case for everything except React components (`portfolio-card.tsx` for utility files, `PortfolioCard.tsx` for components).
- **DB:** snake_case for tables and columns. Plural table names (`students`, not `student`).
- **API routes:** kebab-case, RESTful where natural.
- **Modules:** kebab-case under `/modules/`.

## Gotchas

- **`portfolio.nid.edu` has no per-student profile pages.** It's a thumbnail directory that opens external Behance/Issuu URLs. Our recruiter portal becomes the rich canonical view via server-side ingest. See plan Phase 6.7 for the architecture.
- **Same Hetzner IP for `portfolio` and `industryinterface`** — they share a backend in the current system. Our redesign preserves this by ingesting both into one Postgres.
- **`/disciplines/*` pages are fully public** — match the main `nid.edu` site behavior. No marketing-window gating.
- **Discipline-color theming is real on `nid.edu`** — body classes like `.red_color`, `.purple_color` drive themed accents. We inherit the idiom via `[data-discipline]` attribute on containers.
- **NID main site has accessibility anti-patterns we deliberately do NOT inherit**: `user-scalable=0` viewport lock, no `:focus-visible`, coral `#FF6969` failing WCAG AA on white at body sizes.

Read [[REFERENCES.md]] next.
