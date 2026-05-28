# SKILLS.md — recruiter-onboarding (module-scoped)

> Skills to activate for work in this module. Resolution order is in the root [[../../SKILLS.md]]. Skill content is LLM-agnostic; only the host environment differs.

## Skills relevant to this module

- **vercel:nextjs**
  Source: `vercel-plugin:nextjs`
  Fallback: <https://nextjs.org/docs/app>
  Why: Server Actions, dynamic routes (`/track/[token]`), Form components, redirect helpers.

- **frontend-design**
  Source: `anthropic-skills:frontend-design`
  Fallback: <https://github.com/anthropics/skills/blob/main/frontend-design/SKILL.md>
  Why: status-timeline component layout, mobile-first form patterns.

- **superpowers:test-driven-development**
  Source: `superpowers:test-driven-development`
  Fallback: <https://github.com/obra/superpowers-skills/blob/main/test-driven-development/SKILL.md>
  Why: the state-machine transitions in `src/store.ts` are pure functions and should be TDD'd before they ship.

- **superpowers:verification-before-completion**
  Source: `superpowers:verification-before-completion`
  Fallback: <https://github.com/obra/superpowers-skills/blob/main/verification-before-completion/SKILL.md>
  Why: end-to-end /apply → /track/[token] walk-through is required before marking the module done.

- **code-review**
  Source: built-in `code-review` slash command
  Fallback: <https://github.com/anthropics/skills/blob/main/code-review/SKILL.md>
  Why: every change to `src/store.ts` reviewed before merge.

## Not relevant here

- `vercel:ai-sdk` — this module doesn't touch AI.
- `huggingface-skills:*` — this module doesn't touch ML.
- `impeccable` — reserved for visually intricate surfaces (interview console, candidate browse). The application form is intentionally restrained.
