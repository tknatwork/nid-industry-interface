/**
 * PaymentProvider — Razorpay / PFMS-compatible payment adapter contract.
 *
 * Used for:
 * - Recruiter participation fee (cycle entry).
 * - GP fee bundling at internship intake (Phase 4.18).
 * - Late-registration fees.
 * - Payment-cell adjudication of refunds (Phase 5.15).
 *
 * Implementations: Razorpay (prototype), PFMS direct integration (production).
 */

export type PaymentReason =
  | 'participation-fee'
  | 'gp-fee'
  | 'late-registration-fee'
  | 'pay-differential'
  | 'manual-adjustment';

export interface PaymentInvoice {
  readonly invoiceId: string;
  readonly recruiterId: string;
  readonly cycleId: string;
  readonly reason: PaymentReason;
  readonly amountPaise: number; // Indian denomination — paise to avoid float drift
  readonly gstPaise: number;
  readonly currency: 'INR';
  readonly hsnSac: string;
  readonly issuedAt: Date;
  readonly dueBy: Date;
  readonly hashQr: string; // PDF/A receipt hash; verifiable at /verify/<hash>
}

export interface PaymentReceipt {
  readonly receiptId: string;
  readonly invoiceId: string;
  readonly paidAt: Date;
  readonly amountPaidPaise: number;
  readonly gatewayReference: string;
  readonly pdfUrl: string; // PDF/A-2 receipt on our CDN
}

export interface RefundRecord {
  readonly refundId: string;
  readonly receiptId: string;
  readonly amountPaise: number;
  readonly reason: string;
  readonly approvedBy: string; // admin actor id
  readonly approvedAt: Date;
  readonly gstCreditNoteId?: string;
}

export interface PaymentProvider {
  issueInvoice(invoice: Omit<PaymentInvoice, 'invoiceId' | 'hashQr' | 'issuedAt'>): Promise<PaymentInvoice>;
  recordReceipt(invoiceId: string, gatewayPayload: unknown): Promise<PaymentReceipt>;
  getInvoice(invoiceId: string): Promise<PaymentInvoice | null>;
  getReceipt(receiptId: string): Promise<PaymentReceipt | null>;
  issueRefund(receiptId: string, reason: string, approvedBy: string): Promise<RefundRecord>;
  verifyReceiptHash(hash: string): Promise<PaymentReceipt | null>;
}
