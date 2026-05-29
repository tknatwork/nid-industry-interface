import { z } from 'zod';

/**
 * Zod schemas for the public surface of this module. Every external input
 * passes through these — no raw casts.
 */

export const recruiterStatusValues = [
  'application-received',
  'verification-pending',
  'fee-due',
  'payment-received',
  'approved',
  'credentials-issued',
  'rejected',
] as const;

export const recruiterStatusSchema = z.enum(recruiterStatusValues);
export type RecruiterStatus = z.infer<typeof recruiterStatusSchema>;

export const applyFormSchema = z.object({
  companyName: z.string().trim().min(2, 'Company name is required').max(120),
  sector: z.string().trim().min(2).max(80),
  gst: z
    .string()
    .trim()
    .regex(/^[0-9A-Z]{15}$/, 'GST must be 15 alphanumeric characters'),
  registrationNumber: z.string().trim().min(2).max(40),
  corporateEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Provide a valid corporate email')
    .refine((email) => !PUBLIC_EMAIL_DOMAINS.some((domain) => email.endsWith(`@${domain}`)), {
      message: 'Use a corporate email (not gmail / hotmail / yahoo)',
    }),
  websiteUrl: z.string().trim().url().optional().or(z.literal('').transform(() => undefined)),
  contactName: z.string().trim().min(2).max(80),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[+0-9 ()-]{7,20}$/, 'Provide a valid phone number'),
  cycleId: z.string().trim().min(1),
});

export type ApplyForm = z.infer<typeof applyFormSchema>;

const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'protonmail.com',
];

export interface StatusHistoryEntry {
  readonly status: RecruiterStatus;
  readonly at: string; // ISO 8601
  readonly note?: string;
}

/**
 * GST-compliant participation-fee receipt, generated when payment is recorded.
 * Mocked for the prototype demo — no real gateway, no real PFMS settlement —
 * but shaped like the PDF/A receipt the recruiter will ultimately download
 * from `/recruiter/receipts` (plan Phase 3.3 + 6 payment-compliance notes).
 */
export interface PaymentReceipt {
  readonly receiptId: string; // e.g. NID-RCPT-2026-A-0042
  readonly amountPaise: number;
  readonly paidAt: string; // ISO 8601
  readonly method: string; // mock gateway label, e.g. "Demo gateway (UPI)"
  readonly gatewayRef: string; // mock gateway transaction reference
}

export interface ApplicationTicketRecord {
  readonly ticketId: string;
  readonly cycleId: string;
  readonly companyName: string;
  readonly sector: string;
  readonly gst: string;
  readonly registrationNumber: string;
  readonly corporateEmail: string;
  readonly websiteUrl?: string;
  readonly contactName: string;
  readonly contactPhone: string;
  /** Mock phone-OTP verification at apply time (plan §G — demo, no real SMS). */
  readonly phoneVerified: boolean;
  readonly status: RecruiterStatus;
  readonly statusHistory: readonly StatusHistoryEntry[];
  readonly createdAt: string;
  /** Live participation-fee amount in paise — set when the invoice is issued. */
  readonly feeAmountPaise?: number;
  /** Present once the fee is paid (mock). Mirrors the generated receipt's id. */
  readonly receiptId?: string;
  /** Full receipt record, generated on payment (mock). */
  readonly receipt?: PaymentReceipt;
}

export interface OutboxMessage {
  readonly id: string;
  readonly ticketId: string;
  readonly channel: 'email' | 'sms' | 'whatsapp';
  readonly to: string;
  readonly templateId: string;
  readonly renderedSubject?: string;
  readonly renderedBody: string;
  readonly queuedAt: string;
}
