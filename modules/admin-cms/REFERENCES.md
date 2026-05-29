# REFERENCES.md — admin-cms pointers

## Plan sections
- **Phase 3.4** — admin portal `/admin/content` (Guidelines/FAQ/process/footer/error-catalogue/legal blocks) + cycle config surfaces.
- **Phase 1.5 / "On the current admin model"** — the audit findings: hand-edited HTML cycle dates (stale `11th May, 2025`), scanned image PDFs, scattered footer contact info — the things this module replaces.

## Web surfaces that compose this module
- `apps/web/app/admin/cycles/page.tsx` (+ `actions.ts`) — edit cycle config; the discipline-exposure equity view stays alongside.
- `apps/web/app/admin/content/page.tsx` (+ `actions.ts`) — edit content blocks.
- `packages/ui` `AdminShell` — nav items `cycles` + `content`.

## Future
- Wire the **public** pages (`/cycles`, `/recruiters/guidelines`, `/recruiters/faq`) to render from this store instead of the static `apps/web/lib/*` seeds.
- `@nid/db` `cycle_config` + `content_blocks` tables replace the JSON store.
- Cycle open/close state machine + stipend-floor-matrix editor (separate admin slices).
