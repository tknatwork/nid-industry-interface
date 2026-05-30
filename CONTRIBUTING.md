# Contributing

Thanks for your interest in the NID Industry Interface prototype. This is a
**redesign demo** of the National Institute of Design's recruiter ↔ student
placement portal. It is maintained by a single owner ([@tknatwork](https://github.com/tknatwork)),
so the contribution process is deliberately simple and strict.

Please read this whole document before opening a pull request.

## Demo posture — read this first

This repository is a **prototype with no real backend**. Understanding this is a
prerequisite for contributing:

- **All data is mock data.** Each module persists to a local JSON store
  (`.dev-data/` locally, `/tmp/nid-dev-data` on Vercel) and **re-seeds on a cold
  start**. There is no real database in the demo path.
- **There is no real authentication, payment, or SMS/OTP.** "Login", the payment
  ticket flow, and mobile-number verification are all simulated for the
  walkthrough. Do not wire in a real auth provider, payment processor, or SMS
  gateway.
- **Do not add real secrets, credentials, API keys, tokens, or live PII** —
  anywhere, including tests, fixtures, and seed data. The seeded keys (e.g.
  `key_acme_01`) are intentionally fake demo strings. See [SECURITY.md](SECURITY.md).
- **Preserve the mock posture.** A change that quietly turns a mock into a real
  integration will be rejected. If you think the demo needs a real integration,
  open an issue to discuss it first.

See [DEMO.md](DEMO.md) for the presenter walkthrough and [DEPLOY.md](DEPLOY.md)
for why the mock-store + cold-reseed design is a feature, not a bug.

## Contribution channel

There are **no direct pushes to `main`**. Every change — including the owner's —
lands through a pull request.

External contributors (anyone without write access) use the **fork + pull
request** flow:

1. **Fork** the repository to your own account.
2. Create a **topic branch** off `main` in your fork
   (`feat/...`, `fix/...`, `docs/...`, `chore/...`).
3. Make your change. Keep it small and reviewable — one concern per PR.
4. Open a **pull request** against `tknatwork/nid-industry-interface:main`.
5. Wait for **owner review**. All PRs require approval from the code owner
   (see [.github/CODEOWNERS](.github/CODEOWNERS)).
6. On approval, the PR is **squash-merged** into `main`. The squash commit
   message follows Conventional Commits (see below).

> Summary: **fork → topic branch → PR → owner review → squash-merge.**
> No direct pushes to `main`, ever. External contributors always use fork + PR.

## Run the harness locally before opening a PR

This repo ships a small **native harness** — the same gates CI documents (in
[`.github/workflows/ci.yml`](.github/workflows/ci.yml), which is manual-only on
this demo repo). Run them locally and make sure they pass **before** you open a
PR. Use `pnpm` exclusively — never `npx`.

```bash
pnpm install --frozen-lockfile   # one-time / after dependency changes

pnpm -r typecheck                 # TypeScript strict across every workspace
pnpm -C apps/web build            # the web app must build
pnpm -r test                      # unit tests across every workspace
pnpm boundaries                   # module-boundary check (no illegal cross-module imports)
pnpm check:contracts              # module public-contract check (each module exposes only its index)
```

If any of these fail, fix it before requesting review. A PR with a red harness
will not be merged.

> Tip: `pnpm boundaries && pnpm check:contracts && pnpm -r typecheck` is wired up
> as `pnpm harness` for convenience, but run the full list above (build + tests
> included) before a PR.

## Code expectations

These mirror the project's working agreement in [AGENTS.md](AGENTS.md) — read it
for the full rule-set. The short version:

- **TypeScript strict.** No `any`; no unsafe `as` casts without an explicit
  `// SAFE-CAST: <reason>` comment. Validate every external input with Zod.
- **Respect module boundaries.** A module under `modules/A/` may not import from
  another module's internals — only its public `index.ts`. Shared logic belongs
  in `packages/core/`.
- **Tests alongside the change.** Add or update tests for what you touch.
- **Conventional Commits.** PR titles and squash commit messages use the
  `type(scope): summary` format (`feat`, `fix`, `docs`, `chore`, `refactor`,
  `test`, …).
- **Honor the non-negotiables** from the project README/`CLAUDE.md`: no AI
  ranking/scoring/filtering of students, no bulk shortlisting, no demographic
  sort/filter on the recruiter side, JDs immutable post-publish.

## Reporting bugs and proposing features

- **Bugs and features:** open an issue using the provided
  [issue forms](.github/ISSUE_TEMPLATE/). Blank issues are disabled — pick a
  template.
- **Security vulnerabilities:** do **not** open a public issue. Follow the
  private disclosure process in [SECURITY.md](SECURITY.md).

## License / contribution terms

By contributing, you agree your contributions are provided for use within this
prototype under the repository's terms. Don't submit anything you don't have the
right to contribute.
