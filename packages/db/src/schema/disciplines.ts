import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const disciplines = pgTable('disciplines', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  descriptionMd: text('description_md').notNull(),
  campusIdsJson: text('campus_ids_json').notNull(), // JSON array of campus IDs
  programme: text('programme', { enum: ['bachelors', 'masters', 'both'] }).notNull(),
  version: integer('version').notNull().default(1),
  accentTokenName: text('accent_token_name', {
    enum: ['red', 'yellow', 'cyan', 'green', 'purple', 'navy'],
  }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const disciplineVersionHistory = pgTable('discipline_version_history', {
  id: text('id').primaryKey(),
  disciplineId: text('discipline_id').notNull(),
  version: integer('version').notNull(),
  snapshotJson: text('snapshot_json').notNull(),
  changedBy: text('changed_by').notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobTitleMappings = pgTable('job_title_mappings', {
  rawTitle: text('raw_title').primaryKey(),
  targetDisciplineIdsJson: text('target_discipline_ids_json').notNull(),
  source: text('source', { enum: ['canonical', 'ai-proposed', 'admin-approved'] }).notNull(),
  confidence: integer('confidence').notNull(), // basis points (0–10000)
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DisciplineRow = typeof disciplines.$inferSelect;
export type NewDisciplineRow = typeof disciplines.$inferInsert;
