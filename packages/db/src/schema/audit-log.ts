import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Audit log — emitted on every mutation. Retention: 7 years (confirmed).
 * Indexed on (target_table, target_id, at) for entity-history queries
 * and on (trace_id) for end-to-end trace lookups.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    actorType: text('actor_type', {
      enum: ['recruiter', 'admin', 'student', 'coordinator', 'system'],
    }).notNull(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull(),
    targetTable: text('target_table').notNull(),
    targetId: text('target_id').notNull(),
    beforeJson: text('before_json'),
    afterJson: text('after_json'),
    traceId: text('trace_id').notNull(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
  },
  (table) => ({
    targetIdx: index('audit_target_idx').on(table.targetTable, table.targetId, table.at),
    traceIdx: index('audit_trace_idx').on(table.traceId),
    actorIdx: index('audit_actor_idx').on(table.actorType, table.actorId, table.at),
  }),
);
