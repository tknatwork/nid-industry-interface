import { pgTable, text, integer, timestamp, bigint } from 'drizzle-orm/pg-core';

export const cycles = pgTable('cycles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  campusIdsJson: text('campus_ids_json').notNull(),
  status: text('status', {
    enum: ['draft', 'open', 'in-progress', 'closing', 'closed', 'archived'],
  }).notNull(),
  openDate: timestamp('open_date', { withTimezone: true }).notNull(),
  jdUploadDeadline: timestamp('jd_upload_deadline', { withTimezone: true }).notNull(),
  browseWindowOpens: timestamp('browse_window_opens', { withTimezone: true }).notNull(),
  shortlistDeadline: timestamp('shortlist_deadline', { withTimezone: true }).notNull(),
  interviewWindowStart: timestamp('interview_window_start', { withTimezone: true }).notNull(),
  interviewWindowEnd: timestamp('interview_window_end', { withTimezone: true }).notNull(),
  offerDeadline: timestamp('offer_deadline', { withTimezone: true }).notNull(),
  waveTimeWindowDays: integer('wave_time_window_days').notNull().default(7),
  archiveDate: timestamp('archive_date', { withTimezone: true }).notNull(),
  participationFeePaise: bigint('participation_fee_paise', { mode: 'number' }).notNull(),
  gpFeePerInternPaise: bigint('gp_fee_per_intern_paise', { mode: 'number' }).notNull(),
  lateRegistrationFeePaise: bigint('late_registration_fee_paise', { mode: 'number' }),
  configJson: text('config_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stipendFloorRules = pgTable('stipend_floor_rules', {
  id: text('id').primaryKey(),
  cycleId: text('cycle_id').notNull(),
  disciplineIdsJson: text('discipline_ids_json').notNull(),
  programme: text('programme', { enum: ['bachelors', 'masters'] }).notNull(),
  roleType: text('role_type', {
    enum: ['full-time', 'vacation-internship', 'during-course-internship'],
  }).notNull(),
  floorPaise: bigint('floor_paise', { mode: 'number' }).notNull(),
});

export const eligibilityRules = pgTable('eligibility_rules', {
  id: text('id').primaryKey(),
  cycleId: text('cycle_id').notNull(),
  disciplineIdsJson: text('discipline_ids_json').notNull(),
  minSemester: integer('min_semester'),
  maxSemester: integer('max_semester'),
  minCgpa: integer('min_cgpa'), // *100 to avoid float (e.g. 7.50 -> 750)
  ppoLockExempt: text('ppo_lock_exempt', { enum: ['true', 'false'] }).notNull().default('false'),
  customJson: text('custom_json'),
});

export type CycleRow = typeof cycles.$inferSelect;
export type NewCycleRow = typeof cycles.$inferInsert;
