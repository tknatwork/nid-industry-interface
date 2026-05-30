# SKILLS.md — recruiter-pipeline (module-scoped)

> How to move fast. Resolution order in root [[../../SKILLS.md]]. LLM-agnostic content with fetchable fallbacks.

- **superpowers:test-driven-development** — Source: `superpowers:test-driven-development` · Fallback: <https://github.com/obra/superpowers-skills/blob/main/test-driven-development/SKILL.md> — pin the load-bearing invariants first: forward-only no-op, idempotent re-advance, append-only audit order. These are exactly what the Wave 2 linearity verifier re-checks.

- **superpowers:systematic-debugging** — Source: `superpowers:systematic-debugging` · Fallback: <https://github.com/obra/superpowers-skills/blob/main/systematic-debugging/SKILL.md> — when a stage "won't advance" or audit order looks wrong, trace `rank(to)` vs `rank(from)` against `STAGE_ORDER` before touching the store; most surprises are a mis-ordered enum.

- **code-review** — built-in. Watch for two regressions specific to this module: a weakened forward-only guard (allowing equal/backward writes) and `k: undefined` slipping past `exactOptionalPropertyTypes` on `AuditEntry` optionals.

- **vercel:nextjs** — Source: `vercel-plugin:nextjs` · Fallback: <https://nextjs.org/docs/app> — context only: the consumers are Server Components + Server Actions that call this module's pure functions; this module ships no React and no `'use client'` code.

## Module-specific gotchas

- `exactOptionalPropertyTypes` is on — always omit absent optionals with `...(v !== undefined ? { k: v } : {})`, never `k: undefined`.
- Reads must NOT persist. A JD with no record returns a fresh `published` in-memory; the file is only written on an actual advance/append.
- Keep this module dependency-free beyond `@nid/db` + `zod`. Importing a sibling module to "just read" round/offer state breaks the boundary check and the whole point of the spine.
