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

export interface ApplicationTokenRecord {
  readonly tokenId: string;
  readonly cycleId: string;
  readonly companyName: string;
  readonly sector: string;
  readonly gst: string;
  readonly registrationNumber: string;
  readonly corporateEmail: string;
  readonly websiteUrl?: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly status: RecruiterStatus;
  readonly statusHistory: readonly StatusHistoryEntry[];
  readonly createdAt: string;
  readonly feeAmountPaise?: number;
}

export interface OutboxMessage {
  readonly id: string;
  readonly tokenId: string;
  readonly channel: 'email' | 'sms' | 'whatsapp';
  readonly to: string;
  readonly templateId: string;
  readonly renderedSubject?: string;
  readonly renderedBody: string;
  readonly queuedAt: string;
}
