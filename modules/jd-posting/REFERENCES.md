# REFERENCES.md — jd-posting pointers

## Plan sections

- Phase 4.2 (the canonical JD posting flow this module implements)
- Phase 4.15 (minimum-stipend calculator — shares the floor data)
- Phase 4.18 (GP fee bundling)
- Phase 5.3 (stipend-floor matrix)
- Phase 6.10 (JD schema governance — where skills + floors move when DB lands)
- Phase 8.2 (immutability: "JD edit after publish" is a deliberate non-feature)

## Entities + rules consumed from `@nid/core`

- `Jd`, `JdStatus`, `RoleType`, `WorkMode`, `ResponsibilityCategory` (entity types)
- `StipendFloorRule` (entity)
- `checkStipendFloor(jd, applicableRule, scopeCreepMultiplier)` (rule — the gate)

## Sibling modules

- `recruiter-onboarding` — supplies the demo recruiter (Acme Design Studio) until auth lands
- `admin-jd-moderation` (later) — consumes submitted JDs to publish them
- `candidate-browse` (later) — reads published JDs to match eligible students

## File map (within this module)

- `src/index.ts` — public API
- `src/types.ts` — Zod schemas
- `src/store.ts` — JSON-backed mock JD store (`.dev-data/jd-posting.json`)
- `src/skills.ts` — canonical skill taxonomy
- `src/stipend-floors.ts` — floor matrix
- `src/actions.ts` — use cases

Read [[SKILLS.md]] next.
