# AGENTS.md — student-portal work protocol

Before touching any file in this module:

1. Read [[CLAUDE.md]] (scope) and [[CONTEXT.md]] (invariants + gotchas) fully.
2. Remember the **direction of dependency**: student-portal is *downstream*. It may read `@nid/module-candidate-browse` and `@nid/module-jd-posting` through their public `index.ts`. It must **never** be imported by them — that would create a cycle the harness rejects.
3. The only mutable state this module owns is **per-cycle opt-in**. Do not add student profile, shortlist, slot, or offer *writes* here — those belong to their owning modules. Compose them read-only at the page.

## Rules specific to this module

- **The offer inbox must call `@nid/module-offer-cascade.recordResponse`.** Do not write offer status here, and do not re-implement wave/cascade logic — that lives in `@nid/core` behind offer-cascade.
- **Parse every external input through a Zod schema** at the action boundary (`optInSchema`, `respondToOfferSchema`). No raw form-data reads.
- **Eligibility must stay merit-respecting**: discipline + programme + opt-in + published status only. Never add a CGPA/fit/demographic filter — the guardrail is the same one candidate-browse enforces, mirrored from the student's side.
- **exactOptionalPropertyTypes is on.** Optional fields are declared `field?: T | undefined`. Spread optionals conditionally (`...(x !== undefined ? { x } : {})`).
- Keep imports relative **without** the `.js` extension (Turbopack resolves TS workspace source literally).
- This module extends `tsconfig.node.json` (it uses `node:fs`). Keep it that way.

## Before marking work done

- `pnpm --filter @nid/module-student-portal typecheck` clean.
- `pnpm -r typecheck` clean (the page composition is the real integration test).
- Boot on `:3100`, walk `/student → /student/cycles → /student/jds → /student/applications → /student/offers`, accept the seeded offer, confirm the recruiter offers board reflects it.
