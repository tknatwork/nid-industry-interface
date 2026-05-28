# SKILLS.md — student-portal

Skills to activate when working in this module. Each entry names the skill **and**
a fetchable source, so any LLM (with or without a native skill registry) can
resolve it (Phase 9.4, source-referenced activation).

- **frontend-design**
  Source: anthropic-skills:frontend-design (loaded by default in Claude Code sessions)
  Fallback: https://github.com/anthropics/claude-skills/blob/main/frontend-design/SKILL.md
  Why this module needs it: the eligible-JD feed grid, the application tracker timeline, and the offer-inbox cards are the student's primary surfaces — they must read as one institution with the recruiter portal (NID brand parity, shared tokens).

- **vercel:nextjs**
  Source: vercel-plugin:nextjs (loaded when the Vercel plugin is active)
  Fallback: https://vercel.com/docs/frameworks/nextjs (read via WebFetch if the plugin is absent)
  Why this module needs it: the `/student/*` routes are Server Components with Server-Action accept/decline; the App Router data-flow + action patterns apply directly.

- **code-review**
  Source: anthropic-skills:code-review
  Fallback: https://github.com/anthropics/claude-skills/blob/main/code-review/SKILL.md
  Why this module needs it: the dependency direction (downstream only, no cycle) and the "offer write must route through offer-cascade" invariant are exactly the kind of boundary slips a review pass catches.

Cross-module / global skills (`engineering:architecture`, `commit-commands:commit`)
are inherited from the root [[../../SKILLS.md]]; do not duplicate them here.
