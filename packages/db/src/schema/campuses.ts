import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const campuses = pgTable('campuses', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // 'ahmedabad' | 'gandhinagar' | 'bengaluru'
  name: text('name').notNull(),
  programmesOfferedJson: text('programmes_offered_json').notNull(), // JSON array
  contactEmail: text('contact_email').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CampusRow = typeof campuses.$inferSelect;
export type NewCampusRow = typeof campuses.$inferInsert;
