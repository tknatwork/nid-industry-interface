<!--
  Thanks for the PR! Keep it small and single-concern.
  Read CONTRIBUTING.md first. All PRs go through owner review and squash-merge.
  No direct pushes to main.
-->

## What & why

<!-- What does this change do, and why? Keep it short. -->



## Linked issue

<!-- e.g. "Closes #123". Required unless this is a trivial docs/typo fix. -->

Closes #

## Checklist

- [ ] **What & why** is described above and the change is single-concern.
- [ ] **Linked issue** referenced above (or this is a trivial docs/typo fix).
- [ ] **Tests added/updated** for the behavior I changed.
- [ ] **Harness is green locally** — I ran and all passed:
  - [ ] `pnpm -r typecheck`
  - [ ] `pnpm -C apps/web build`
  - [ ] `pnpm -r test`
  - [ ] `pnpm boundaries`
  - [ ] `pnpm check:contracts`
- [ ] **No secrets or credentials** — no real API keys, tokens, passwords, or
      live PII in code, tests, fixtures, or seed data.
- [ ] **Demo mock-posture preserved** — no real auth / payment / SMS / database
      was wired in; mock stores and cold-start re-seed still work.
- [ ] **Conventional Commits** — my PR title is `type(scope): summary`.

## Notes for the reviewer

<!-- Anything the owner should know: trade-offs, follow-ups, screenshots, etc. -->
