"""NID Industry Interface — ML JD scope-creep analyzer (worker).

Implements the structured scope-creep classifier behind the @nid/core
`JdScopeAnalyzer` port. Given a JD's structured fields (skills tagged with their
taxonomy group + which responsibility categories are populated), it returns a
graduated stipend-floor multiplier plus the flags a human moderator needs.

Phase 6.11a principle: *default to ML where the task is structured and
deterministic.* Scope-creep detection is rule-based here (auditable, self-hostable,
zero model download) — exactly the deterministic core the plan calls for. The TS
adapter validates this JSON with Zod and falls back to a local heuristic if this
worker is unreachable, so JD posting never hard-depends on the worker being up.

Runtime: Python stdlib `http.server` — zero third-party deps, runs with
`python3 app.py`. PRODUCTION SWAP (Phase 6.13.1): replace the HTTP layer with
FastAPI + uvicorn and the dataclasses with Pydantic v2 models. The `classify()`
function is framework-free and moves over unchanged; only `_Handler` is replaced.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

# Taxonomy groups the worker treats as "design work". A JD that bundles
# engineering skills on top of these is the canonical scope-creep signal
# (Phase 4.2). Mirrors @nid/module-jd-posting's SkillGroup union; in production
# both read one canonical taxonomy from the DB.
DESIGN_GROUPS = {"research", "craft", "systems", "tools", "leadership"}
ENGINEERING_GROUP = "engineering"

# Responsibility categories that signal real build/ship ownership (not just
# design hand-off) — they push the multiplier up when dev skills are present.
DELIVERY_CATEGORIES = {"delivery", "ops"}

VALID_ROLE_TYPES = {"full-time", "vacation-internship", "during-course-internship"}

# Bounds for the graduated multiplier when scope creep is detected.
_BASE_CREEP_MULTIPLIER = 1.3
_PER_EXTRA_DEV_SKILL = 0.1
_DELIVERY_BUMP = 0.1
_MAX_MULTIPLIER = 1.7


class ValidationError(ValueError):
    """Raised when the request payload does not match the expected shape."""


@dataclass(frozen=True)
class Skill:
    slug: str
    group: str
    required: bool


@dataclass(frozen=True)
class ScopeRequest:
    role_type: str
    skills: list[Skill]
    responsibility_categories: list[str]


def parse_request(payload: Any) -> ScopeRequest:
    """Validate + coerce the JSON body. The Pydantic model replaces this in prod."""
    if not isinstance(payload, dict):
        raise ValidationError("body must be a JSON object")

    role_type = payload.get("roleType")
    if role_type not in VALID_ROLE_TYPES:
        raise ValidationError(f"roleType must be one of {sorted(VALID_ROLE_TYPES)}")

    raw_skills = payload.get("skills", [])
    if not isinstance(raw_skills, list):
        raise ValidationError("skills must be an array")
    skills: list[Skill] = []
    for entry in raw_skills:
        if not isinstance(entry, dict):
            raise ValidationError("each skill must be an object")
        slug = entry.get("slug")
        group = entry.get("group")
        if not isinstance(slug, str) or not slug:
            raise ValidationError("skill.slug must be a non-empty string")
        if not isinstance(group, str) or not group:
            raise ValidationError("skill.group must be a non-empty string")
        skills.append(Skill(slug=slug, group=group, required=bool(entry.get("required", False))))

    raw_cats = payload.get("responsibilityCategories", [])
    if not isinstance(raw_cats, list) or not all(isinstance(c, str) for c in raw_cats):
        raise ValidationError("responsibilityCategories must be an array of strings")

    return ScopeRequest(role_type=role_type, skills=skills, responsibility_categories=raw_cats)


def classify(req: ScopeRequest) -> dict[str, Any]:
    """Pure scope-creep classifier. Framework-free — survives the FastAPI swap."""
    dev_skills = [s for s in req.skills if s.group == ENGINEERING_GROUP]
    design_skills = [s for s in req.skills if s.group in DESIGN_GROUPS]
    detected_groups = sorted({s.group for s in req.skills})
    has_delivery = any(c in DELIVERY_CATEGORIES for c in req.responsibility_categories)

    # Scope creep = engineering work bundled into a design role. A pure-engineering
    # JD (no design skills) is not "scope creep" — it's just out of NID's remit,
    # which the discipline mapping handles separately; here we only flag the bundle.
    creep = bool(dev_skills) and bool(design_skills)

    if not creep:
        multiplier = 1.0
        rationale = (
            "No scope creep: "
            + (
                "engineering skills present but no design craft to bundle them with."
                if dev_skills
                else "the role stays within design craft; no engineering bundled in."
            )
        )
        flagged: list[str] = []
    else:
        multiplier = _BASE_CREEP_MULTIPLIER + _PER_EXTRA_DEV_SKILL * (len(dev_skills) - 1)
        if has_delivery:
            multiplier += _DELIVERY_BUMP
        multiplier = round(min(multiplier, _MAX_MULTIPLIER), 2)
        flagged = [s.slug for s in dev_skills]
        delivery_note = (
            " Delivery/ops responsibilities indicate real build ownership, not just hand-off."
            if has_delivery
            else ""
        )
        rationale = (
            f"Scope creep: {len(dev_skills)} engineering skill(s) "
            f"({', '.join(flagged)}) bundled with {len(design_skills)} design skill(s)."
            f"{delivery_note} Stipend floor raised ×{multiplier}."
        )

    return {
        "scopeMultiplier": multiplier,
        "scopeCreepDetected": creep,
        "flaggedSkillSlugs": flagged,
        "detectedGroups": detected_groups,
        "rationale": rationale,
    }


class _Handler(BaseHTTPRequestHandler):
    server_version = "nid-ml-jd-analyzer/0.1"

    def _send(self, code: int, body: dict[str, Any]) -> None:
        raw = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:  # noqa: N802 (stdlib handler naming)
        if self.path == "/health":
            self._send(200, {"status": "ok", "service": "ml-jd-analyzer"})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/ml/jd/scope-classify":
            self._send(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            result = classify(parse_request(payload))
        except ValidationError as exc:
            self._send(400, {"error": str(exc)})
            return
        except (json.JSONDecodeError, ValueError) as exc:
            self._send(400, {"error": f"bad request: {exc}"})
            return
        self._send(200, result)

    def log_message(self, fmt: str, *args: Any) -> None:
        # Quiet by default; structured logging + Langfuse trace wiring lands later.
        return


def main() -> None:
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "127.0.0.1")
    server = ThreadingHTTPServer((host, port), _Handler)
    print(f"ml-jd-analyzer listening on http://{host}:{port}")  # noqa: T201
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
