import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const applications = pgTable('applications', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  jdId: text('jd_id').notNull(),
  status: text('status', {
    enum: ['submitted', 'shortlisted', 'rejected', 'withdrawn'],
  }).notNull(),
  coverNoteMd: text('cover_note_md'),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
});

export const shortlists = pgTable('shortlists', {
  id: text('id').primaryKey(),
  jdId: text('jd_id').notNull(),
  studentId: text('student_id').notNull(),
  recruiterNoteMd: text('recruiter_note_md').notNull(), // CHECK: non-empty enforced at app layer + DB
  shortlistedAt: timestamp('shortlisted_at', { withTimezone: true }).notNull().defaultNow(),
  invitedToRoundsJson: text('invited_to_rounds_json').notNull().default('[]'),
});

export const slots = pgTable('slots', {
  id: text('id').primaryKey(),
  jdId: text('jd_id'),
  day: timestamp('day', { withTimezone: true }).notNull(),
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(),
  capacity: integer('capacity').notNull(),
  disciplineHintId: text('discipline_hint_id'),
  meetingLinkUrl: text('meeting_link_url'), // recruiter-pasted, not OAuth'd
});
