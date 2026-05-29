// @nid/module-admin-cms — public API.
//
// Admin-editable cycle config + CMS content blocks (Phase 3.4). Replaces the
// current portal's hand-edited HTML cycle dates + scanned PDFs.

export {
  getCycleConfig,
  updateCycleConfig,
  listContentBlocks,
  getContentBlock,
  updateContentBlock,
} from './actions';

export type { CycleConfig, ContentBlock, ActionResult } from './types';
