import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  campusId: text('campus_id').notNull(),
  disciplineId: text('discipline_id').notNull(),
  programme: text('programme', { enum: ['bachelors', 'masters'] }).notNull(),
  semester: integer('semester').notNull(),
  batchYear: integer('batch_year').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  portfolioUrl: text('portfolio_url'),
  cvUrl: text('cv_url'),
  cgpaCents: integer('cgpa_cents'), // CGPA * 100, e.g. 7.50 -> 750
  hasPpoLock: boolean('has_ppo_lock').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const studentCycleOptIns = pgTable('student_cycle_opt_ins', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  cycleId: text('cycle_id').notNull(),
  optedInAt: timestamp('opted_in_at', { withTimezone: true }).notNull().defaultNow(),
  codeOfConductAccepted: boolean('code_of_conduct_accepted').notNull().default(false),
  codeOfConductAcceptedAt: timestamp('code_of_conduct_accepted_at', { withTimezone: true }),
});

export const studentConductEntries = pgTable('student_conduct_entries', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  cycleId: text('cycle_id').notNull(),
  type: text('type', {
    enum: ['offer-acceptance', 'no-show', 'ghost-after-acceptance', 'breach-of-conduct'],
  }).notNull(),
  severity: text('severity', {
    enum: ['info', 'warning', 'reduced-visibility', 'ineligible-next-cycle'],
  }).notNull(),
  rationale: text('rationale').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  appealStatus: text('appeal_status', {
    enum: ['open', 'reviewing', 'upheld', 'overturned'],
  }),
});
