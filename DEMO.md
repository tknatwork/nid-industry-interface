# Demo build — written walkthrough

A presenter script for the NID Industry Interface prototype. The **recruiter**
side is the live, interactive surface; the **institution (admin)** and **student**
sides are shown as referenced examples (open them live with the ↗ links when you
want to drive the cross-portal loop).

- Live demo: https://nid-industry-interface.vercel.app
- One-screen playground (recruiter live + admin/student reference): **/playground**
- All state is mock data and re-seeds on a cold start, so every session starts clean.

## The cast (seeded data)

| Who | Identity | State |
|---|---|---|
| Recruiter | Acme Design Studio (`NID-2026-A-0001`) | Excellent health band (80); active API key `key_acme_01` |
| Student | Aanya Roy (`stu_0005`, M.Des Product Design) | Opted into Spring 2026; holds a pending ₹12L offer |
| Published JD | `jd_00001` "Product Designer" | 2 positions, ₹9–14L, Wave-1 offer floated to Aanya |
| Flagged JD | `jd_00004` "Product Designer (frontend-heavy)" | Design + dev bundle → analyzer ×1.6 → ₹9.6L floor > ₹8L offered |
| Other companies | Bauhaus (Good), Pixel Forge (Watch 42), GhostCorp (Blacklisted) | populate the admin health-score board |

## Act 1 — Recruiter (live, the focus)

1. **Offers / wave cascade** (`/recruiter/jds/jd_00001/offers`): 2 open positions, Wave 1 floated, one **pending** offer to Aanya. Strict 1:1 to positions — no buffer.
2. **Post a JD** (`/recruiter/jds/new`): fill the structured wizard. Set pay below the floor → the **stipend gate blocks** submission with the published formula (no black box).
3. **Applicants** (`/recruiter/jds/jd_00001/applicants`): portfolio-first grid, discipline-filtered, **individual** shortlist with a required note — no bulk select, no CGPA/fit sort.
4. **Your stats** (`/recruiter/stats`): the company's health band + conduct signals it carries into the next cycle (the accountability loop made visible to the recruiter).

## Act 2 — Student (reference; open live to drive the loop)

1. **Opt-in** (`/student/cycles`): Aanya opts into Spring 2026 → the Product Designer JD appears in her **eligible feed** (`/student/jds`).
2. **Offer inbox** (`/student/offers`): the pending **₹12L** offer. She **Accepts**.
3. Back on the recruiter **Offers** pane, hit **↻** → the board moves to **filled 1/2**. That's the live cross-portal cascade on one shared backend.
4. **Report a company** (`/student/report-company`) files a redressal straight into the admin queue (Act 3).

## Act 3 — Institution / Placement admin (reference; open live)

1. **JD moderation** (`/admin/jds/jd_00004`): the scope-creep JD is flagged — ML analyzer **×1.6**, adjusted floor **₹9.6L** vs the ₹8L offer. Admin holds it for re-scope.
2. **Health scores** (`/admin/health-scores`): the spread across bands. Open **Pixel Forge**.
3. **Redressal** (`/admin/redressal`): decide the stipend-not-paid case as **upheld** → Pixel Forge's score drops **42 → 27** (Watch → Restricted), live.
4. **API keys / blacklist**: revoking GhostCorp's key (`key_ghost_01`) makes the federation API return **401** — access is genuinely revocable.

## Act 4 — Federation API (optional, live)

```bash
B=https://nid-industry-interface.vercel.app
curl $B/api/public/cycles.json
curl -H 'x-api-key: nid-inst-ahmedabad-demo' $B/api/v1/institution/cycles
curl -H 'Authorization: Bearer key_acme_01'  $B/api/v1/recruiter/me      # 200
curl -H 'Authorization: Bearer key_ghost_01' $B/api/v1/recruiter/me      # 401 (revoked)
curl $B/api/v1/openapi.json
```

## The one-line pitch

The institution sits between recruiter vocabulary and design disciplines; AI
translates and flags but never ranks students; and every guardrail (stipend
floor, individual shortlist, wave cascade, scope-creep analyzer) is enforceable
because both sides are accountable — scored, blacklistable, API-revocable.
