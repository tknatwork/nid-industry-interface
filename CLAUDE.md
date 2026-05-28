# NID Industry Interface — Project Root Context

> This is the project root entry point. Any AI agent working in this repository — Claude, GPT, Gemini, local self-hosted models — reads this file first to understand what this project is and how to work on it.

## What this project is

A redesign prototype of the National Institute of Design's (NID) Industry Interface portal — the placement system that brokers recruiter ↔ student interaction across the 3 legacy DPIIT campuses (Ahmedabad, Gandhinagar, Bengaluru R&D). The existing system at `industryinterface.nid.edu` runs on ASP.NET Web Forms with hand-edited HTML cycle dates and an email-first recruiter onboarding flow. This prototype rebuilds it as a modular Next.js monolith with project-local AI-assisted development tooling.

## Project isolation guarantee

**This project is fully self-contained within this folder.** No state propagates to or from any global GCC layer (e.g. `~/CLAUDE CONTEXT/GCC/`). The plan file lives at `/Users/tusharkant/.claude/plans/this-is-a-demo-wiggly-parrot.md` and is the authoritative reference for all architectural decisions — read it once at session start to absorb context, then operate within this folder.

## The 5-markdown contract — read all of them on session start

This file (`CLAUDE.md`) is the entry point. Before touching any code or making any changes, you must read the other four in this order:

1. **[[AGENTS.md]]** — what to do *before* touching files (work protocol). This is the rule-set you follow on every change.
2. **[[CONTEXT.md]]** — what to *know* (domain knowledge, decisions already made, gotchas).
3. **[[REFERENCES.md]]** — *where to look* (pointers to the plan, design tokens, external APIs, related modules).
4. **[[SKILLS.md]]** — *how to move fast* (skills + their fetchable source URLs, so any LLM can resolve them).

Each module under `/modules/` also has its own 5-markdown contract, scoped to that module's concerns. Working on a specific module means loading that module's contracts, not the global ones, to keep prompt context light.

## Session-start protocol

Per the plan's Phase 9.3:

1. Read `.gcc/session-memory.md` to discover prior session state.
2. **Always ask the user explicitly**: "Continue from the last session (last touched: `<module>`, next step: `<summary>`)? Or start fresh on a different concern?"
3. **Never auto-continue.** This is intentional — the user is in control of session boundaries.
4. If the prior session crossed the bloat threshold (50K accumulated tokens, or >50MB JSONL), recommend a fresh session and generate a transfer prompt at `.gcc/transfer-prompts/<timestamp>.md` so the next session can pick up cleanly.

## Authoritative architectural references

- The plan file: `/Users/tusharkant/.claude/plans/this-is-a-demo-wiggly-parrot.md`
- Phase 3: Information Architecture
- Phase 4: 19 recruiter user flows
- Phase 5: 15 supporting flows
- Phase 6: Cross-cutting concerns (compliance, design tokens, animation, heuristics, traffic peaks)
- Phase 6.13: Stack decisions (TypeScript + Python, Next.js 15, Vercel-then-portable, pnpm)
- Phase 9: Prototype build architecture (this 5-markdown contract + GCC + native harness)

## Stack at a glance

- **Web:** TypeScript strict, Next.js 15 App Router, React 19, Tailwind v4, shadcn/ui, Drizzle ORM
- **ML/LLM workers:** Python 3.13+, FastAPI, Pydantic v2, transformers + sentence-transformers + self-hosted local LLM via vLLM
- **DB:** Postgres 16+ (Supabase for prototype, self-hosted for production)
- **Package manager:** pnpm exclusively (`pnpm exec`, `pnpm dlx`, never `npx`)
- **Host:** Vercel Fluid Compute for prototype, deliberately portable for self-hosted STQC-cleared production

## Non-negotiable rules

- All AI ranking, fit-scoring, or filtering of students is forbidden. AI is a translator (discipline mapping, summarization) never a judge.
- Bulk shortlisting is forbidden. Individual evaluation only, with required recruiter notes.
- Demographic sort/filter on the recruiter side is forbidden.
- JDs are immutable post-publish. Updates create new JDs that chain to the original.
- Stipend floor compliance is checked at both endpoints of the salary range for full-time.
- Read replicas are NOT used (out of scope at NID's institutional scale).
- No central meeting-platform integration. Recruiters paste their own joining links.

## What "done" looks like for any task

- Tests written first or alongside the change (per the Phase 6.12a engineering principles).
- TypeScript strict passes (no `any`, no unsafe casts without `// SAFE-CAST: <reason>` comment).
- Zod validation at every external boundary.
- Audit log entry emitted for any mutation.
- Module boundary respected (no cross-module imports outside the declared interface).
- Trace ID propagated end-to-end.

Read [[AGENTS.md]] next.
