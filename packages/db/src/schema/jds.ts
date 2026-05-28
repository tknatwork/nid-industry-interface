import { pgTable, text, integer, bigint, timestamp } from 'drizzle-orm/pg-core';

export const jds = pgTable('jds', {
  id: text('id').primaryKey(),
  recruiterId: text('recruiter_id').notNull(),
  cycleId: text('cycle_id').notNull(),
  replacesJdId: text('replaces_jd_id'),
  status: text('status', {
    enum: ['draft', 'in-moderation', 'published', 'closed', 'withdrawn'],
  }).notNull(),

  title: text('title').notNull(),
  roleType: text('role_type', {
    enum: ['full-time', 'vacation-internship', 'during-course-internship'],
  }).notNull(),
  location: text('location').notNull(),
  workMode: text('work_mode', { enum: ['onsite', 'remote', 'hybrid'] }).notNull(),
  positions: integer('positions').notNull(),
  targetStartDate: timestamp('target_start_date', { withTimezone: true }),

  baseMinPaise: bigint('base_min_paise', { mode: 'number' }),
  baseMaxPaise: bigint('base_max_paise', { mode: 'number' }),
  stipendPaise: bigint('stipend_paise', { mode: 'number' }),
  variableComponent: text('variable_component'),
  equityComponent: text('equity_component'),
  joiningBonusPaise: bigint('joining_bonus_paise', { mode: 'number' }),
  relocationPaise: bigint('relocation_paise', { mode: 'number' }),

  skillsRequiredJson: text('skills_required_json').notNull().default('[]'),
  responsibilitiesJson: text('responsibilities_json').notNull().default('{}'),
  deliverablesJson: text('deliverables_json').notNull().default('[]'),
  supplementaryProseMd: text('supplementary_prose_md'),

  targetDisciplineIdsJson: text('target_discipline_ids_json').notNull().default('[]'),
  interviewRoundsJson: text('interview_rounds_json').notNull().default('[]'),

  draftedAt: timestamp('drafted_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
});

export type JdRow = typeof jds.$inferSelect;
export type NewJdRow = typeof jds.$inferInsert;
