# SKILLS.md — admin-accountability

Skills to activate when working in this module. Source-referenced so any LLM can
resolve them (Phase 9.4).

- **frontend-design**
  Source: anthropic-skills:frontend-design (loaded by default in Claude Code)
  Fallback: https://github.com/anthropics/claude-skills/blob/main/frontend-design/SKILL.md
  Why: the health-score dashboard, the redressal queue, and the band pills are dense admin tables — they need clear hierarchy + the shared NID tokens/status-pill semantics.

- **data:build-dashboard**
  Source: anthropic-skills:data-build-dashboard
  Fallback: https://github.com/anthropics/claude-skills/blob/main/data/build-dashboard/SKILL.md
  Why: `/admin/health-scores` is a triage dashboard (worst-first, band distribution); dashboard layout + scannability patterns apply directly.

- **security-review**
  Source: anthropic-skills:security-review
  Fallback: https://github.com/anthropics/claude-skills/blob/main/security-review/SKILL.md
  Why: this is the consequence surface (blacklist, API-revoke, redressal). Decisions are irreversible-ish and audit-logged; a security lens guards against missing authorization/audit on a decision path.

- **code-review**
  Source: anthropic-skills:code-review
  Fallback: https://github.com/anthropics/claude-skills/blob/main/code-review/SKILL.md
  Why: the "decision emits exactly one event, atomically" invariant and the "score is derived not stored" rule are easy to regress; a review pass catches it.

Global skills (`engineering:architecture`, `commit-commands:commit`) are inherited
from the root [[../../SKILLS.md]].
