# AGENTS.md — Work Protocol for AI Agents on This Project

> The rules an AI agent must follow *before* touching any file in this repository. This file is loaded by every agent on session start, regardless of which LLM is hosting the agent.

## Before any code change

1. **Confirm session continuity.** Read `.gcc/session-memory.md`. Ask the user whether to continue from the last session or start fresh. Never auto-continue.
2. **Read [[CONTEXT.md]]** to refresh project-specific knowledge.
3. **Identify the target module.** If the change is module-scoped, switch to that module's 5-markdown contract (under `/modules/<name>/`) and stop loading root-level markdowns beyond this one.
4. **Activate the relevant skills.** Per [[SKILLS.md]], resolve each skill via its source URL if the host environment doesn't have it loaded. If a skill cannot be resolved, log it to `.gcc/session-memory.md` as a `[0.5] missing skill: <name>` entry and proceed without it.
5. **Check the plan.** The authoritative architectural source is `/Users/tusharkant/.claude/plans/this-is-a-demo-wiggly-parrot.md`. If the change contradicts a decision in the plan, stop and ask the user before proceeding.

## When writing code

1. **TypeScript strict** is non-negotiable. No `any`. No unsafe `as` casts without an explicit `// SAFE-CAST: <reason>` comment. Zod parses all external input.
2. **Module boundaries are real.** A module under `/modules/A/` cannot import from `/modules/B/internal/`. The only legal import is the module's public `index.ts`. If you need to violate this, the answer is "you don't" — refactor the shared logic into `packages/core/` instead.
3. **Pure domain core, side-effects at the edges.** Business logic lives in `packages/core/` as pure functions. Adapters (`packages/adapters/`) handle DB, email, AI, payments. Server actions in `apps/web/` orchestrate.
4. **Audit by default.** Every mutation emits an `audit_log` entry as part of the transaction. No silent state changes.
5. **Trace IDs propagate.** Every server action threads its trace ID through DB queries, AI calls, and audit log entries.
6. **Server Components by default.** Use Client Components only when local state genuinely matters (forms, real-time consoles).

## When running tools

- **Use `pnpm exec <cmd>`** for any project-local binary (e.g. `pnpm exec tsc`, `pnpm exec drizzle-kit`).
- **Use `pnpm dlx <pkg>`** for one-off packages not installed in the project.
- **Never use `npx`.** It bypasses lockfile verification and is a banned executor.
- **Never modify `pnpm-lock.yaml` manually.** Let pnpm update it.
- **Never run `pnpm install --no-frozen-lockfile` in CI.** Local dev is fine; CI requires frozen.

## When working with the database

1. Migrations are **forward-only in production.** Down migrations exist for local dev convenience only.
2. Schema changes go through Drizzle migrations, never raw SQL except for backfills.
3. Per-cycle data goes through the `cycle` entity. Hardcoded dates in code are forbidden.
4. Every schema modification updates seed data + tests in the same PR.

## When working with AI/ML

1. AI APIs touching student data are sandboxed to `summarize | translate | explain | draft`. They cannot `rank | score | filter`.
2. All AI calls go through `packages/adapters/ai/AIProvider`. No direct provider SDK imports in domain code.
3. Self-hosted local LLM is the production default. Vercel AI Gateway is dev-convenience only.
4. Every AI call is instrumented through Langfuse with a trace ID linking to the audit log.

## When working with the design system

1. **Components reference semantic tokens only.** No `var(--grey-...)` or `var(--space-1)` directly in component CSS. Use `var(--text-primary)`, `var(--surface-card)`, etc.
2. **Mobile-first authoring.** Smallest viewport first; tablet and desktop add via `min-width` queries.
3. **Discipline accent themes** scope via `[data-discipline]` attribute on a container; do not hardcode a discipline color in a component.
4. **Honor `prefers-reduced-motion`.** All transitions collapse to 0ms or instant fade when this is set.

## Commit + PR discipline

1. Conventional Commits format. The harness enforces it.
2. Every commit is small and reviewable. No "WIP" commits in main.
3. PRs require CI green: lint, type-check, tests, boundary checks, OpenAPI diff.
4. Update `.gcc/session-memory.md` before ending a session.

## Boundary with the user

1. When a decision touches the architectural principles in [[CONTEXT.md]] or the plan, ask the user before deciding.
2. When a decision is implementation detail (variable names, micro-refactors, test structure), decide and proceed.
3. When uncertain whether a decision is architectural, ask.

## When done with a task

1. Run the targeted tests for the touched module(s).
2. Verify the boundary check passes locally (`pnpm exec dependency-cruiser`).
3. Update `.gcc/session-memory.md` with what was accomplished, the immediate next step, and any open questions.
4. Mark the task completed via the agent's task system if one is in use.

Read [[CONTEXT.md]] next.
