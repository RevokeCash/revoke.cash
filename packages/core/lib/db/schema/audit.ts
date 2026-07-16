import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AuditAction, AuditEventDetails } from '../../audit/actions';
import { lowercaseAddress } from '../types/lowercase-address';

export const auditSchema = pgSchema('audit');

// Append-only trail of actions taken by authenticated users and the admin. Rows are never
// updated or deleted, and referenced ids deliberately have no foreign keys so audit events
// outlive whatever they reference.
export const auditEvents = auditSchema.table(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorAddress: lowercaseAddress('actor_address').notNull(),
    action: text('action').notNull().$type<AuditAction>(),
    // The address the action was performed on, when it differs from the actor
    // (e.g. the added/removed subscription address)
    targetAddress: lowercaseAddress('target_address'),
    subscriptionId: uuid('subscription_id'),
    chainId: integer('chain_id'),
    details: jsonb('details').notNull().$type<AuditEventDetails>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_events_created').on(table.createdAt),
    index('idx_audit_events_actor_created').on(table.actorAddress, table.createdAt),
    index('idx_audit_events_target_created')
      .on(table.targetAddress, table.createdAt)
      .where(sql`${table.targetAddress} IS NOT NULL`),
    index('idx_audit_events_subscription_created')
      .on(table.subscriptionId, table.createdAt)
      .where(sql`${table.subscriptionId} IS NOT NULL`),
  ],
);
