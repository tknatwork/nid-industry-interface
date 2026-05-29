# modules/admin-cms — Module Entry Point

> Scoped to admin-editable content (Phase 3.4): per-cycle config + CMS content blocks. Replaces the current portal's hand-edited HTML cycle dates (a stale `11th May, 2025` once leaked next to fresh dates) and its static/scanned PDFs. Root context: [[../../CLAUDE.md]].

## What this module owns

```
/admin/cycles    Edit the current cycle's config (label, status, fee, key dates)
                 — persists; the discipline-exposure equity view sits alongside it.
/admin/content   Edit the CMS content blocks (guidelines · faq · process · footer ·
                 error-catalogue · legal) as rich-text — replaces static HTML/PDF.
```

Admin edits **persist** (JSON store). This is the surface that turns "webmaster
edits markup every cycle" into "admin edits config in the portal."

## What this module does NOT own

- The public *rendering* of cycles/disciplines (that's `apps/web/lib/public-content.ts` +
  the public pages) — this module is the admin **editing** surface. (For the demo the two
  aren't wired together; production reads public pages from this store.)
- Cycle *state machine* (open/close transitions beyond the status field), stipend-floor
  matrix editing, comms templates — later admin slices.
- Real DB — JSON-backed mock store; swap for `cycle_config` + `content_blocks` tables.

## Where things live

| File | Purpose |
|---|---|
| `src/index.ts` | Public API. |
| `src/types.ts` | CycleConfig, ContentBlock + Zod update schemas. |
| `src/store.ts` | JSON store; seeds the current cycle + 6 content blocks. |
| `src/actions.ts` | getCycleConfig/updateCycleConfig · listContentBlocks/getContentBlock/updateContentBlock. |

Read [[AGENTS.md]], [[CONTEXT.md]], [[REFERENCES.md]], [[SKILLS.md]] next.
