# CONTEXT.md — ml-jd-analyzer knowledge

## The classifier rule (deterministic)

- `dev_skills` = skills whose `group == "engineering"`.
- `design_skills` = skills whose group ∈ {research, craft, systems, tools, leadership}.
- **Scope creep is the *bundle*:** `dev_skills AND design_skills`. A pure-engineering JD is NOT scope creep — it is simply out of NID's remit, which the discipline mapping handles separately. A pure-design JD is fine.
- When creep: `multiplier = 1.3 + 0.1·(dev_count − 1)`, `+0.1` if any delivery/ops responsibility, capped at **1.7**. Otherwise `1.0`.
- Graduated on purpose: the legacy TS heuristic was binary (1.0 / 1.4). The worker's value-add is the graduation + the rationale string + flagged-skill list a human moderator reads.

## Invariants

1. **Multiplier ≥ 1, ≤ 1.7.** The TS Zod schema also enforces `≥ 1`.
2. **The worker never gates submission.** It informs the admin moderation view. The TS adapter falls back to the binary heuristic if this worker is unreachable (graceful degradation, Phase 6.12b).
3. **No LLM, no third-party deps.** Stdlib only. Auditable + self-hostable + zero cost (the project's ML-vs-LLM cost stance, Phase 6.11a).

## Decisions / gotchas

- **Taxonomy duplication is intentional for the slice.** The worker hard-codes `DESIGN_GROUPS` / `ENGINEERING_GROUP`, mirroring `@nid/module-jd-posting`'s `SkillGroup`. In production both read one canonical taxonomy from the DB. Keep the two in sync until then.
- **Stdlib http.server, not FastAPI** — deliberate, so the demo runs with zero install. `classify()` and `parse_request()` are framework-free; the FastAPI/Pydantic production swap (Phase 6.13.1) replaces only `_Handler`. Do not put business logic in the handler.
- **Python pin:** root `.python-version` says 3.13; 3.14 also works (only stdlib used). `pyproject.toml` requires `>=3.13`.
- **Contract is shared with TS by shape, not by codegen.** `app.py`'s response keys must stay identical to `scopeResponseSchema` in `modules/jd-posting/src/scope-analyzer.ts`. If you rename a field, change both.

## Failure modes this service owns

- Bad payload → `400` with a human-readable `{error}`. The TS adapter treats any non-200 as "fall back to heuristic", so a 400 degrades safely (it does not surface a stack trace to the recruiter/admin).
- Worker down / slow → TS adapter times out at 1500ms and falls back.

## Audit-log fields (when the audit adapter + Langfuse wiring land)

`module: 'ml-jd-analyzer'`, `action: 'scope.classify'`, plus a `traceId` propagated from the TS caller, `scopeMultiplier`, `scopeCreepDetected`. Langfuse captures input/output/latency per Phase 6.11b.
