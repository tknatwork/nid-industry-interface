# SKILLS.md — candidate-browse (module-scoped)

> Resolution order in root [[../../SKILLS.md]]. Skill content is LLM-agnostic.

## Skills relevant to this module

- **frontend-design**
  Source: `anthropic-skills:frontend-design`
  Fallback: <https://github.com/anthropics/skills/blob/main/frontend-design/SKILL.md>
  Why: the portfolio-first grid is the visual heart of the recruiter experience; tile rhythm, hover, responsive columns matter.

- **impeccable**
  Source: project-installed skill
  Fallback: search installed Claude Code plugins
  Why: this is a "make it genuinely good" surface — the grid is what recruiters spend the most time on. Reserved for high-polish surfaces like this one.

- **vercel:nextjs**
  Source: `vercel-plugin:nextjs`
  Fallback: <https://nextjs.org/docs/app>
  Why: dynamic nested route (`/recruiter/jds/[jdId]/applicants/[studentId]`), search-param-driven sort, Server Actions for shortlist.

- **superpowers:test-driven-development**
  Source: `superpowers:test-driven-development`
  Fallback: <https://github.com/obra/superpowers-skills/blob/main/test-driven-development/SKILL.md>
  Why: the discipline-filter + opt-in gate is pure logic — TDD it.

- **code-review** + **security-review**
  Source: built-in slash commands
  Why: this surface touches student PII; review for the guardrails (no demographic exposure, no bulk, note-required) and for privacy.
