/**
 * CommsProvider — unified comms adapter contract.
 *
 * Used for:
 * - Email (Resend default; institutional SMTP for production).
 * - SMS (Twilio default; MSG91/Gupshup for production).
 * - WhatsApp Business API (BSP) for 3-party time-sensitive coordination
 *   between recruiter, student coordinator, and shortlisted students.
 *
 * The portal does NOT integrate with meeting platforms (Zoom/Meet/etc.) —
 * recruiters paste their own joining links. See Phase 6.11c of the plan.
 *
 * All comms flow through one channel (industry@nid.edu) at the inbound side
 * and fan out internally by stage (Phase 5.6 comms hierarchy).
 */

export type CommsChannel = 'email' | 'sms' | 'whatsapp';

export type CommsTemplateId =
  | 'application.received'
  | 'application.verified'
  | 'payment.due'
  | 'payment.received'
  | 'credentials.issued'
  | 'jd.published'
  | 'jd.applicants.added'
  | 'shortlist.confirmed'
  | 'interview.scheduled'
  | 'interview.reminder'
  | 'interview.delayed'
  | 'offer.issued'
  | 'offer.accepted'
  | 'offer.declined'
  | 'offer.cascaded'
  | 'rejection.collective'
  | 'health-score.band-changed'
  | 'cycle.opened'
  | 'cycle.closing-soon';

export interface CommsMessage {
  readonly channel: CommsChannel;
  readonly to: string; // email, phone, or WhatsApp number
  readonly templateId: CommsTemplateId;
  readonly templateVars: Readonly<Record<string, string>>;
  readonly traceId: string; // propagated end-to-end
  readonly cycleId?: string;
  readonly recruiterId?: string;
  readonly studentId?: string;
}

export interface CommsDeliveryRecord {
  readonly messageId: string;
  readonly channel: CommsChannel;
  readonly to: string;
  readonly templateId: CommsTemplateId;
  readonly sentAt: Date;
  readonly deliveredAt?: Date;
  readonly status: 'queued' | 'sent' | 'delivered' | 'failed';
  readonly failureReason?: string;
  readonly traceId: string;
}

export interface CommsProvider {
  send(message: CommsMessage): Promise<CommsDeliveryRecord>;

  /** Bulk send for batched comms (e.g. rejection-collective to N students). */
  sendBatch(messages: readonly CommsMessage[]): Promise<readonly CommsDeliveryRecord[]>;

  /** Fetch delivery status for a previously-sent message. */
  getDelivery(messageId: string): Promise<CommsDeliveryRecord | null>;
}
