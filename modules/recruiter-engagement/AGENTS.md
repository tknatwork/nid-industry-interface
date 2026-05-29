# AGENTS.md — recruiter-engagement work protocol

Before touching any file:

1. Read [[CLAUDE.md]] + [[CONTEXT.md]].
2. This module has no `@nid/*` dependencies (only `zod`). Keep it that way — it is a leaf.

## Rules specific to this module

- **Booking is one-way + flips supply state.** `bookPpt`/`bookMeeting` mark the window/slot `booked` in the same write. Guard against double-booking (status check) — done in the actions.
- **Never integrate a meeting platform.** Store the recruiter's pasted link as a plain string; never proxy/rewrite it (Phase 6.11c). No Zoom/Meet/Webex SDKs.
- **The meeting agenda starts from `DEFAULT_MEETING_AGENDA`** (4.12) — the recruiter adds to it; don't drop the template.
- Parse every input through its Zod schema at the action boundary.
- exactOptionalPropertyTypes is on; spread optionals conditionally. Extends `tsconfig.node.json` (uses `node:fs`). Relative imports omit `.js`.

## Before marking work done

- All 5 markdown contracts present (`pnpm check:contracts`).
- `pnpm --filter @nid/module-recruiter-engagement typecheck` + `pnpm -r typecheck` clean.
- `pnpm boundaries` clean (leaf module, no cross-module imports).
- Boot `:3100`; book a PPT window at `/recruiter/ppt` and a meeting at `/recruiter/meetings`, confirm each flips to "booked" and appears in the booked list.
