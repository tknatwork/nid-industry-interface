// @nid/module-recruiter-engagement — public API.
//
// Recruiter ↔ placement-cell scheduling touchpoints (Phase 4.3 PPT + 4.12
// meetings). Admin publishes windows/slots; the recruiter books + pastes their
// own meeting link (no platform integration, Phase 6.11c).

export {
  listPptWindows,
  listPptBookings,
  bookPpt,
  publishPptWindow,
  listMeetingSlots,
  listMeetings,
  bookMeeting,
  publishMeetingSlot,
} from './actions';

export {
  DEFAULT_MEETING_AGENDA,
  type PptWindow,
  type PptBooking,
  type MeetingSlot,
  type Meeting,
  type ActionResult,
} from './types';
