// @nid/module-slot-booking — public API (cross-module imports come through here).

export {
  publishSlot,
  listOpenSlots,
  assignStudent,
  unassignStudent,
  listAssignmentsForJd,
  slotById,
} from './actions';

export type { Slot, SlotAssignment, ActionResult } from './types';
