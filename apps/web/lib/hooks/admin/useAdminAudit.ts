'use client';

import type { AdminAuditEvent } from '@revoke.cash/core/admin/audit';
import type { AuditAction } from '@revoke.cash/core/audit/actions';
import { keepPreviousData } from '@tanstack/react-query';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';

interface AdminAuditParams {
  address?: string;
  subscriptionId?: string;
  actions?: AuditAction[];
  page: number;
  pageSize: number;
}

interface AdminAuditResponse {
  items: AdminAuditEvent[];
  totalCount: number;
}

const ADMIN_AUDIT_QUERY_KEY = ['admin', 'audit'];

export const useAdminAudit = (params: AdminAuditParams) => {
  const { actions, ...scalarParams } = params;

  // Sorted before joining so the query key stays stable regardless of selection order
  const serializedActions = actions && actions.length > 0 ? [...actions].sort().join(',') : undefined;

  const searchParams = Object.fromEntries(
    Object.entries({ ...scalarParams, actions: serializedActions })
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );

  return useAdminQuery<AdminAuditResponse>([...ADMIN_AUDIT_QUERY_KEY, searchParams], '/api/admin/audit', {
    searchParams,
    placeholderData: keepPreviousData,
  });
};
