# Repo hardening runbook — `tknatwork/nid-industry-interface`

> **Who runs this:** the repository **owner** (`@tknatwork`). These are GitHub
> **access-control settings** — branch protection, who can push, security
> toggles. They cannot be set by the codebase or by an agent on your behalf; you
> apply them once in the GitHub UI (or with `gh`, where noted). The in-repo
> governance **files** (`CODEOWNERS`, `CONTRIBUTING.md`, PR/issue templates,
> `SECURITY.md`, `dependabot.yml`) are already committed — this runbook is the
> settings layer that makes them enforceable.

The goal: **nothing lands on the codebase without your explicit approval**, and
anyone proposing a change goes through a defined channel (fork → PR → your
review). On a **public** repo, outside contributors already have **no write
access** — they can only fork + open PRs or file issues. Branch protection adds
owner-gated merges and blocks history rewrites.

---

## 0. Ordering (do this first)

`CODEOWNERS` must exist on `main` **before** you turn on "require Code Owner
review", or the rule has no owners file to read. So:

1. Merge the governance PR (the one adding `.github/CODEOWNERS`,
   `CONTRIBUTING.md`, templates, `SECURITY.md`, `dependabot.yml`) into `main`.
2. Then apply the protection + security settings below.

Also confirm `@tknatwork` is the exact GitHub handle in `.github/CODEOWNERS`
(edit it if your handle differs).

---

## 1. Protect `main` (require PRs + your review, block history rewrites)

**UI — Settings → Rules → Rulesets → New branch ruleset** (recommended; rulesets
are the modern replacement for branch-protection):

- **Name:** `protect-main` · **Enforcement:** Active
- **Target branches:** Include default branch (`main`)
- Enable:
  - ✅ **Require a pull request before merging**
    - Required approvals: **1**
    - ✅ Dismiss stale approvals when new commits are pushed
    - ✅ Require review from **Code Owners**
  - ✅ **Require status checks to pass** → add your CI check(s) once CI runs on PRs
    (currently CI is `workflow_dispatch`-only; add the check here when you wire CI
    to `pull_request`).
  - ✅ **Block force pushes**
  - ✅ **Restrict deletions**
  - (optional) ✅ **Require linear history** (squash/rebase merges only)
  - (optional) Include administrators — uncheck "Bypass" so even you merge via PR.

**CLI alternative** (classic branch-protection API):

```bash
gh api -X PUT repos/tknatwork/nid-industry-interface/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -F required_pull_request_reviews[required_approving_review_count]=1 \
  -F required_pull_request_reviews[require_code_owner_reviews]=true \
  -F required_pull_request_reviews[dismiss_stale_reviews]=true \
  -F enforce_admins=true \
  -F required_status_checks=null \
  -F restrictions=null \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

> Set `required_status_checks` to your CI context (e.g.
> `{"strict":true,"contexts":["build"]}`) once CI runs on `pull_request`.

---

## 2. Protect history on every branch (block force-push + deletion)

**Settings → Rules → Rulesets → New branch ruleset:**

- **Name:** `no-history-rewrite` · **Enforcement:** Active
- **Target branches:** All branches (`~ALL`) — or pattern `**/*`
- Enable only: ✅ **Block force pushes** · ✅ **Restrict deletions**

This protects feature branches (e.g. `feat/*`) from force-push/deletion while
still allowing normal pushes during development. Merges to `main` still go
through the `protect-main` ruleset above.

---

## 3. Collaborator access (keep write to yourself)

**Settings → Collaborators and teams:**

- Keep **write** access to **you only**. Do not add collaborators unless you
  intend them to push.
- External contributors need **no access** — fork + PR is their path on a public
  repo (documented in `CONTRIBUTING.md`).

Check current collaborators:

```bash
gh api repos/tknatwork/nid-industry-interface/collaborators --jq '.[].login'
```

---

## 4. Code-security features (Settings → Code security and analysis)

Enable:

- ✅ **Dependabot alerts** — surfaces advisories (`dependabot.yml` already
  automates the update PRs).
- ✅ **Dependabot security updates** — auto-opens fix PRs.
- ✅ **Secret scanning** + ✅ **Push protection** — blocks accidental secret
  commits (important for a public repo; the codebase has no real secrets, but
  this prevents a future mistake).
- (optional) ✅ **Require signed commits** (via a ruleset) if you want verified
  authorship.

---

## 5. Verify it's working

- Try pushing a trivial commit straight to `main` → it should be **rejected**
  (PR required).
- Open a test PR → you should be **auto-requested as a reviewer** (CODEOWNERS),
  and merge should be **blocked until you approve**.
- `git push --force` to any branch → **rejected**.

---

## Current security posture (context for reviewers)

- **Runtime dependency advisories: 0** (`pnpm audit --prod`). See `SECURITY.md`
  for the dev/build-only advisories that are knowingly accepted (no runtime
  reach).
- **No real secrets** in the repo — only `.env.example` dummies; demo creds are
  fake (`.example` domains, mock OTP/payment). See `SECURITY.md`.
- This is a **demo/prototype** on mock data — severity is judged in that context
  (`SECURITY.md` → "Demo posture and threat model").
