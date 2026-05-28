# SKILLS.md — Skills with Source References

> Skills are listed with both a skill identifier AND a fetchable fallback source URL. Any LLM agent — with or without a native skill registry — can resolve a skill by reading the fallback markdown directly. Skills themselves are plain LLM-agnostic markdown content. Read this last; activate the relevant skills on session start.

## Resolution order

When an agent encounters a referenced skill on session start:

1. **Already loaded in the host environment?** Use directly.
2. **Available in the host's "available skills" list but not loaded?** Invoke the host's loader (e.g. Claude Code's `Skill` tool).
3. **Not available in the host?** Fetch the fallback URL via WebFetch and apply its guidance inline.
4. **Source resolution fails?** Log `[0.5] missing skill: <name>` to `.gcc/session-memory.md` and proceed without it.

## Root-level skills (apply to all modules)

### Engineering discipline

- **engineering:architecture**
  Source: `anthropic-skills:engineering-architecture` (Claude Code skill registry)
  Fallback: `https://github.com/anthropics/skills/blob/main/engineering/architecture/SKILL.md`
  Why: cross-module decisions about read/write separation, caching boundaries, queue topology, observability.

- **code-review**
  Source: built-in `code-review` slash command
  Fallback: `https://github.com/anthropics/skills/blob/main/code-review/SKILL.md`
  Why: every PR runs a review pass before merge.

- **security-review**
  Source: built-in `security-review` slash command
  Fallback: `https://github.com/anthropics/skills/blob/main/security-review/SKILL.md`
  Why: per Phase 6.1 compliance posture and the secure-by-default library guidance.

### Verification + TDD

- **superpowers:verification-before-completion**
  Source: `superpowers:verification-before-completion`
  Fallback: `https://github.com/obra/superpowers-skills/blob/main/verification-before-completion/SKILL.md`
  Why: a feature isn't done until it's verified end-to-end. Strict on UI changes.

- **superpowers:test-driven-development**
  Source: `superpowers:test-driven-development`
  Fallback: `https://github.com/obra/superpowers-skills/blob/main/test-driven-development/SKILL.md`
  Why: strict for `packages/core/` domain logic; advisory for UI experimentation.

### Frontend baseline

- **frontend-design**
  Source: `anthropic-skills:frontend-design`
  Fallback: `https://github.com/anthropics/skills/blob/main/frontend-design/SKILL.md`
  Why: visual polish, layout decisions, motion language.

- **impeccable**
  Source: project-installed skill
  Fallback: search the user's installed Claude Code plugins
  Why: high-bar visual polish for production-quality UI; activated on modules where NID brand-parity matters most.

### Stack-specific

- **vercel:nextjs**
  Source: `vercel-plugin:nextjs` (loaded when Vercel plugin is active)
  Fallback: `https://nextjs.org/docs/app`
  Why: App Router primitives, RSC patterns, Server Actions.

- **vercel:vercel-functions**
  Source: `vercel-plugin:vercel-functions`
  Fallback: `https://vercel.com/docs/functions`
  Why: Fluid Compute, Functions runtime, region selection.

- **vercel:shadcn**
  Source: `vercel-plugin:shadcn`
  Fallback: `https://ui.shadcn.com/docs`
  Why: shadcn/ui component composition and theming.

- **vercel:vercel-storage**
  Source: `vercel-plugin:vercel-storage`
  Fallback: `https://vercel.com/docs/storage`
  Why: Blob, KV alternatives, file uploads.

### Process

- **commit-commands:commit**
  Source: project-installed slash command
  Fallback: hand-written: "Use Conventional Commits format; one concern per commit; never amend a pushed commit."
  Why: enforce commit discipline.

- **claude-md-management:revise-claude-md**
  Source: `anthropic-skills:claude-md-management`
  Fallback: `https://github.com/anthropics/skills/blob/main/claude-md-management/SKILL.md`
  Why: keep the modular CLAUDE.md files in sync with the global one (advisory, not auto-blocked).

## How module-level SKILLS.md files differ

Each module under `/modules/<name>/` has its own `SKILLS.md` that lists only the skills relevant to that module. For example, `modules/jd-posting/SKILLS.md` will include `frontend-design`, `vercel:nextjs`, `vercel:ai-sdk`, `huggingface-skills:transformers-js` (for client-side ML hints), and `code-review` — but not all the root-level skills above.

This per-module scoping is what keeps prompt context light. An agent working on JD posting doesn't pay the prompt cost of skills relevant to admin redressal queues.

## Skill content rule (LLM agnostic)

Any new skill we author or fork into the fallback URL list must be:
- Plain markdown with no Claude-only syntax (no `<thinking>` tags, no Anthropic SDK-specific patterns).
- A description of principles, patterns, and procedures — not model-specific instructions.
- Self-contained — readable without needing the broader Claude Code (or any host's) context.

If we encounter a skill in the wild that violates this, we wrap or fork it into a model-neutral version stored at our fallback URL.

End of 5-markdown contract. Loop back to [[CLAUDE.md]] for the next session.
