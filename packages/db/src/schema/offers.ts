import { pgTable, text, integer, bigint, timestamp } from 'drizzle-orm/pg-core';

export const offers = pgTable('offers', {
  id: text('id').primaryKey(),
  jdId: text('jd_id').notNull(),
  studentId: text('student_id').notNull(),
  wave: integer('wave').notNull(),
  ctcPaise: bigint('ctc_paise', { mode: 'number' }),
  stipendPaise: bigint('stipend_paise', { mode: 'number' }),
  location: text('location').notNull(),
  role: text('role').notNull(),
  joiningDate: timestamp('joining_date', { withTimezone: true }).notNull(),
  offerLetterPdfUrl: text('offer_letter_pdf_url').notNull(),
  status: text('status', {
    enum: ['pending', 'on-hold', 'accepted', 'declined', 'expired'],
  }).notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  windowExpiresAt: timestamp('window_expires_at', { withTimezone: true }).notNull(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  responseReason: text('response_reason'),
});

export type OfferRow = typeof offers.$inferSelect;
export type NewOfferRow = typeof offers.$inferInsert;
