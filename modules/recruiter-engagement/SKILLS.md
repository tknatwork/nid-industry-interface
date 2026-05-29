# SKILLS.md — recruiter-engagement

Skills to activate when working here. Source-referenced (Phase 9.4).

- **frontend-design**
  Source: anthropic-skills:frontend-design (loaded by default in Claude Code)
  Fallback: https://github.com/anthropics/claude-skills/blob/main/frontend-design/SKILL.md
  Why: the PPT + meeting booking forms (window pickers, agenda editors) are the surfaces; they share the NID tokens + RecruiterShell chrome.

- **vercel:nextjs**
  Source: vercel-plugin:nextjs (loaded when the Vercel plugin is active)
  Fallback: https://vercel.com/docs/frameworks/nextjs (WebFetch if plugin absent)
  Why: booking is a Server-Action form post on App Router; the action/revalidate pattern applies.

- **code-review**
  Source: anthropic-skills:code-review
  Fallback: https://github.com/anthropics/claude-skills/blob/main/code-review/SKILL.md
  Why: the "no double-booking + flip supply in the same write" invariant and the "never integrate a meeting platform" rule are easy to regress.

Global skills inherited from the root [[../../SKILLS.md]].
