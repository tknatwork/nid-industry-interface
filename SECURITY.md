# Security Policy

This is the **NID Industry Interface** redesign **prototype** — a
demonstration build, not a production system. Please read the
[Demo posture and threat model](#demo-posture-and-threat-model) section before
reporting, because it shapes how severity is assessed here.

## Reporting a vulnerability

**Please report security issues privately. Do not open a public GitHub issue,
pull request, or discussion for a vulnerability.**

Preferred channel:

- **GitHub Security Advisories** — use
  ["Report a vulnerability"](https://github.com/tknatwork/nid-industry-interface/security/advisories/new)
  on this repository. This opens a private advisory visible only to you and the
  maintainer.

GitHub Security Advisories is the private reporting channel for this repository —
it works without any email address and the report is visible only to you and the
maintainer. (The maintainer may add a direct security contact here later; until
then, please use Security Advisories rather than a public issue.)

When you report, please include:

- The affected area (route, module, API endpoint, or build/tooling).
- A description of the issue and its impact.
- Reproduction steps or a proof of concept.
- Whether the issue has runtime reach or is dev/build-only (see below).

You'll get an acknowledgement as soon as the maintainer sees it. As a
single-maintainer demo project there is no formal SLA, but reports are taken
seriously and triaged on a best-effort basis. Please give a reasonable window
for a fix before any public disclosure (coordinated disclosure).

## Demo posture and threat model

Severity here is judged in the context of what this prototype actually is:

- **All data is mock data.** Stores are local JSON that **re-seed on a cold
  start** (`.dev-data/` locally, `/tmp/nid-dev-data` on Vercel). There is no
  production database in the demo path.
- **No real PII.** Seeded people (e.g. "Aanya Roy") and companies are fictional.
  There is no real personal data to exfiltrate.
- **No real authentication, payments, or SMS.** "Login", the payment ticket
  flow, and mobile-number verification are **simulated**. Seeded API keys (e.g.
  `key_acme_01`, `nid-inst-ahmedabad-demo`) are deliberately fake demo strings,
  not live credentials.
- **No real secrets in the repo.** `.env*` files with real values are
  gitignored; only `.env.example` with dummy values is committed.

Because of this, what would be **critical** in production is often **low or
informational** here:

- "The demo API key is hardcoded" → **not a vulnerability**; it's a fake demo
  string with no real access (revoking it in the demo simply makes the mock API
  return `401`, which is the point of the walkthrough).
- "User-submitted data isn't durably stored / resets" → **expected behavior**,
  not a security flaw.
- "No real auth on `/admin`" → **by design** for the demo; there is no real
  account system.

Conversely, the following **are** in scope and genuinely worth reporting:

- **Cross-site scripting (XSS)** or HTML/JS injection reachable from any input.
- **Server-side request forgery (SSRF)**, path traversal, or arbitrary file
  read/write reachable at runtime (e.g. via the mock store or an API route).
- **Remote code execution** or injection (command/SQL/template) in any code
  path that runs.
- **Dependency vulnerabilities with runtime reach** (i.e. that affect shipped
  app code, not just dev/build tooling).
- **Leakage of any real secret** that was accidentally committed despite the
  rules above — report this immediately and privately.

If you're unsure whether something is in scope given the demo posture, report it
privately anyway and let the maintainer make the call.

## Supported versions

This is a rolling prototype. Only the latest `main` (and the live demo deployed
from it) is supported. There are no maintained release branches.

| Version | Supported |
| ------- | --------- |
| `main` (latest) | ✅ |
| anything older  | ❌ |

## Accepted advisories (dev/build-only, no runtime reach)

Some dependency advisories are knowingly accepted because the affected package
is **dev/build-only and never reaches shipped runtime code** (build tools,
linters, type-checkers, test runners). These are tracked here for transparency
rather than fixed reactively. The production dependency audit
(`pnpm audit --prod --audit-level=high`) is the gate that matters for runtime
reach.

| Advisory | Package | Reason accepted (no runtime reach) | Reviewed |
| -------- | ------- | ---------------------------------- | -------- |
| _placeholder_ | _devDependency only_ | _Build/dev tooling; not bundled into the deployed app. Re-evaluate if it moves to a runtime dependency._ | _YYYY-MM-DD_ |

> Entries are added only after confirming the advisory has no path into
> `dependencies` of any shipped package. Anything with runtime reach is fixed,
> not accepted.
