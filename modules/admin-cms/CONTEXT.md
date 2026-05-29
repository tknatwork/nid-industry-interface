# CONTEXT.md — admin-cms knowledge

## Entities
- **CycleConfig** — one editable record per cycle (label, status, fee, key dates). Keyed by `cycleId`.
- **ContentBlock** — one editable record per content slot (guidelines/faq/process/footer/error-catalogue/legal).

## Invariants
1. **Edits persist, seeds are the fallback.** The store writes the JSON file on every update; the seed is used only when the file is absent.
2. **Update is Zod-validated** at the boundary; `updateContentBlock` rejects unknown slots (you can edit the 6 seeded slots, not invent arbitrary ones in this slice).
3. **`updatedAt` is stamped** by the store on every write, so the admin can see freshness.

## Why this module exists (audit findings it fixes)
- The live portal encodes cycle dates as **hand-edited HTML date spans** — a stale `11th May, 2025` was once found next to fresh 2026 dates because the webmaster missed one. This module makes cycle config a single editable record.
- The Guidelines/FAQ are **scanned image PDFs** with zero extractable text. Content blocks replace them with editable, searchable HTML.

## Gotchas
- **Demo seam:** the public pages (`/cycles`, `/recruiters/guidelines`, etc.) currently render from `apps/web/lib/public-content.ts` / `recruiter-public.ts`, NOT from this store. Wiring the public renderer to read this store is a documented follow-on; for now `/admin/cycles` + `/admin/content` are the editing surfaces and the edits persist + display on those admin pages.
- Reset: clear `apps/web/.dev-data/admin-cms.json` to restore seeds.

## Audit-log fields (when the audit adapter lands)
`module: 'admin-cms'`, `action: 'cycle.config.updated' | 'content.block.updated'`, `actorType: 'admin'`, plus `cycleId`/`slot`.
