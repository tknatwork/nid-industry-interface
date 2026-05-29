# SKILLS.md — admin-cms

Skills to activate when working here. Source-referenced (Phase 9.4).

- **frontend-design**
  Source: anthropic-skills:frontend-design (loaded by default in Claude Code)
  Fallback: https://github.com/anthropics/claude-skills/blob/main/frontend-design/SKILL.md
  Why: the edit surfaces are forms over cycle config + rich-text content blocks; they use the shared NID tokens + AdminShell chrome.

- **claude-md-management:revise-claude-md**
  Source: anthropic-skills:claude-md-management
  Fallback: https://github.com/anthropics/claude-skills/blob/main/claude-md-management/SKILL.md
  Why: this module IS a CMS — editing structured content/config blocks; the same discipline of keeping authored content coherent applies.

- **code-review**
  Source: anthropic-skills:code-review
  Fallback: https://github.com/anthropics/claude-skills/blob/main/code-review/SKILL.md
  Why: the "edits persist, seed is fallback" + "reject unknown slots" invariants are easy to regress.

Global skills inherited from the root [[../../SKILLS.md]].
