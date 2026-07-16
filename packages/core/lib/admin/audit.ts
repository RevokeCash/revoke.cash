import type { AuditAction, AuditEventDetails } from '@revoke.cash/core/audit/actions';
import { getDb } from '@revoke.cash/core/db/client';
import { auditEvents } from '@revoke.cash/core/db/schema/audit';
import { and, count, desc, eq, gte, inArray, or } from 'drizzle-orm';
import type { Address } from 'viem';

export interface AdminAuditEvent {
  id: string;
  action: AuditAction;
  actorAddress: Address;
  targetAddress: Address | null;
  subscriptionId: string | null;
  chainId: number | null;
  details: AuditEventDetails;
  createdAt: string;
}

interface AdminAuditFilters {
  // Matches events where the address is either the actor or the target
  address?: Address;
  actions?: AuditAction[];
  subscriptionId?: string;
  page: number;
  pageSize: number;
}

interface AdminAuditPage {
  items: AdminAuditEvent[];
  totalCount: number;
}

export const getAdminAuditEvents = async (filters: AdminAuditFilters): Promise<AdminAuditPage> => {
  const conditions = [
    filters.address
      ? or(eq(auditEvents.actorAddress, filters.address), eq(auditEvents.targetAddress, filters.address))
      : undefined,
    filters.actions && filters.actions.length > 0 ? inArray(auditEvents.action, filters.actions) : undefined,
    filters.subscriptionId ? eq(auditEvents.subscriptionId, filters.subscriptionId) : undefined,
  ];

  const [rows, [{ totalCount }]] = await Promise.all([
    getDb()
      .select()
      .from(auditEvents)
      .where(and(...conditions))
      .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize),
    getDb()
      .select({ totalCount: count() })
      .from(auditEvents)
      .where(and(...conditions)),
  ]);

  const items = rows.map(
    (row): AdminAuditEvent => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }),
  );

  return { items, totalCount };
};

export interface SubscriptionAddressChangeCounts {
  addedCount: number;
  removedCount: number;
}

export const getSubscriptionAddressChangeCounts = async (
  subscriptionId: string,
  since: Date,
): Promise<SubscriptionAddressChangeCounts> => {
  const rows = await getDb()
    .select({ action: auditEvents.action, actionCount: count() })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.subscriptionId, subscriptionId),
        inArray(auditEvents.action, ['subscription_address_added', 'subscription_address_removed']),
        gte(auditEvents.createdAt, since),
      ),
    )
    .groupBy(auditEvents.action);

  const countByAction = new Map(rows.map((row) => [row.action, row.actionCount]));

  return {
    addedCount: countByAction.get('subscription_address_added') ?? 0,
    removedCount: countByAction.get('subscription_address_removed') ?? 0,
  };
};
