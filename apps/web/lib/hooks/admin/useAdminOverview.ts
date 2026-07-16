'use client';

import type { ExecutorGasBalance, ExecutorSpend } from '@revoke.cash/core/admin/executor';
import type { AdminHealth } from '@revoke.cash/core/admin/health';
import type { AnnualRunRate } from '@revoke.cash/core/admin/subscriptions';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';

interface AdminRevenueOverview {
  runRate: AnnualRunRate;
}

interface AdminBalancesOverview {
  balances: ExecutorGasBalance[];
  spend30d: ExecutorSpend[];
}

export const useAdminRevenueOverview = () => {
  return useAdminQuery<AdminRevenueOverview>(['admin', 'overview', 'revenue'], '/api/admin/overview/revenue');
};

export const useAdminBalances = () => {
  return useAdminQuery<AdminBalancesOverview>(['admin', 'overview', 'balances'], '/api/admin/overview/balances');
};

export const useAdminHealth = () => {
  return useAdminQuery<AdminHealth>(['admin', 'overview', 'health'], '/api/admin/overview/health');
};
