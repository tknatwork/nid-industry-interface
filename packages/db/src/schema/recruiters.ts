import { pgTable, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const recruiters = pgTable('recruiters', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  sector: text('sector').notNull(),
  gst: text('gst').notNull().unique(),
  registrationNumber: text('registration_number').notNull(),
  corporateEmail: text('corporate_email').notNull().unique(),
  websiteUrl: text('website_url'),
  category: text('category', { enum: ['private', 'mnc', 'govt', 'ngo'] }).notNull(),
  memberSince: timestamp('member_since', { withTimezone: true }).notNull(),
  verified: boolean('verified').notNull().default(false),
  verifiedBy: text('verified_by'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const recruiterContacts = pgTable('recruiter_contacts', {
  id: text('id').primaryKey(),
  recruiterId: text('recruiter_id').notNull(),
  role: text('role', {
    enum: ['hr-director', 'hiring-manager', 'interviewer', 'api-admin'],
  }).notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
});

export const applicationTokens = pgTable('application_tokens', {
  id: text('id').primaryKey(),
  recruiterId: text('recruiter_id'),
  cycleId: text('cycle_id').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone').notNull(),
  status: text('status', {
    enum: [
      'application-received',
      'verification-pending',
      'fee-due',
      'payment-received',
      'approved',
      'credentials-issued',
      'rejected',
      'withdrawn',
    ],
  }).notNull(),
  statusHistoryJson: text('status_history_json').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const recruiterEngagements = pgTable('recruiter_engagements', {
  id: text('id').primaryKey(),
  recruiterId: text('recruiter_id').notNull(),
  cycleId: text('cycle_id').notNull(),
  feePaidAt: timestamp('fee_paid_at', { withTimezone: true }),
  status: text('status').notNull(),
  meetingsWithPlacementHead: integer('meetings_with_placement_head').notNull().default(0),
});

export const recruiterHealth = pgTable('recruiter_health', {
  recruiterId: text('recruiter_id').primaryKey(),
  score: integer('score').notNull().default(50),
  band: text('band', {
    enum: ['excellent', 'good', 'watch', 'restricted', 'blacklisted'],
  }).notNull().default('good'),
  lastComputedAt: timestamp('last_computed_at', { withTimezone: true }).notNull().defaultNow(),
});
