# AGENTS.md — Module work protocol (interview-console)

## Rules

1. No cross-module internal imports; consumers use `@nid/module-interview-console`.
2. **Cross-interview conflict must stay anonymized.** The view model exposes only `{ inAnotherInterview: boolean, etaBack?: 'HH:MM' }` — never the competing recruiter's identity or JD. Do not add a field that leaks it.
3. **Demo mode must be sandboxed.** Demo data carries `isDemo: true` and is clearly watermarked in the UI. It must never write to any store or emit audit entries.
4. **Transport mode is recruiter-selectable** — never hardcode a single transport. The setting persists per recruiter; default is `live` (SSE).
5. Mobile-first: the route is authored at phone width first; desktop is a relaxed variant.

## When real assignments exist vs not

`buildInterviewDayView` returns the real queue (from slot-booking assignments) when any exist for the JD; otherwise the route falls back to the DEMO dataset so the console is never empty during onboarding. The real vs demo distinction is explicit (`isDemo`).
