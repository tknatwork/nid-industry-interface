# SKILLS.md — ml-jd-analyzer

Skills to activate when working in this Python worker. Source-referenced so any
LLM can resolve them (Phase 9.4).

- **pyright-lsp** (or any Python LSP)
  Source: anthropic-skills:pyright-lsp (loaded by default in Claude Code)
  Fallback: https://github.com/anthropics/claude-skills/blob/main/pyright-lsp/SKILL.md
  Why: the worker is `mypy --strict` + ruff; a Python LSP keeps types honest as the FastAPI swap lands.

- **engineering:system-design**
  Source: anthropic-skills:engineering-system-design
  Fallback: https://github.com/anthropics/claude-skills/blob/main/engineering/system-design/SKILL.md
  Why: the worker is a separate-process service behind an HTTP contract with a graceful-degradation fallback on the caller — the boundary + failure-mode design is the system-design concern.

- **code-review**
  Source: anthropic-skills:code-review
  Fallback: https://github.com/anthropics/claude-skills/blob/main/code-review/SKILL.md
  Why: the response shape is duplicated as a Zod schema on the TS side; a review pass catches field-name drift between `app.py` and `scope-analyzer.ts`.

When the production FastAPI swap happens, also resolve `huggingface-skills:transformers`
(for the LayoutLM JD-extraction endpoint) — not needed for the rule-based scope classifier.
