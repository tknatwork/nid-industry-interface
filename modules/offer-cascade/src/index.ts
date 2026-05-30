// @nid/module-offer-cascade — public API.

export {
  issueOffer,
  recordResponse,
  listOffers,
  cascadeFor,
  tallyFor,
  lockFloatSequence,
  sweepExpiredOffers,
  autoFloatNext,
  simulateDeadlinePassed,
  getSequence,
} from './actions';
export type { OfferRecord, OfferStatus, ActionResult, FloatSequenceRecord } from './types';
