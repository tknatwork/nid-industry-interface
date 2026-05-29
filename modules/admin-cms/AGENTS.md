# AGENTS.md — admin-cms work protocol

Before touching any file:

1. Read [[CLAUDE.md]] + [[CONTEXT.md]].
2. This module depends only on `zod` — it is a leaf. Do not import other modules; do not let others import it in a cycle.

## Rules specific to this module

- **Edits persist; seeds are the floor.** `loadState` falls back to the seed only when the JSON file is absent. An admin edit to a content block or the cycle config must survive a reload (it writes the file).
- **Parse every update through its Zod schema** (`cycleConfigUpdateSchema`, `contentBlockUpdateSchema`) at the action boundary. `updateContentBlock` rejects unknown slots.
- **Cycle dates are free-text strings here** (e.g. "14 May 2026"), matching the public display format — not Date objects. Keep it that way unless the public renderer changes.
- exactOptionalPropertyTypes is on; spread optionals conditionally. Extends `tsconfig.node.json` (uses `node:fs`). Relative imports omit `.js`.

## Before marking work done

- All 5 markdown contracts present (`pnpm check:contracts`).
- `pnpm --filter @nid/module-admin-cms typecheck` + `pnpm -r typecheck` clean.
- `pnpm boundaries` clean (leaf module).
- Boot `:3100`; edit a content block at `/admin/content` and the cycle fee/date at `/admin/cycles`, reload, confirm the change persisted.
