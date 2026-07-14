'use client';

import type {
  AdminSubscriptionDetail,
  AdminSubscriptionFilter,
  AdminSubscriptionsPage,
} from '@revoke.cash/core/admin/subscriptions';
import type { AutoRevokeRules } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import type { AutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';
import type { SerializedMonthlyBudget } from 'lib/hooks/auto-revoke/useAutoRevokeBudget';
import ky from 'lib/ky';
import { toast } from 'react-toastify';
import type { Address } from 'viem';

interface AdminSubscriptionsListParams {
  filter: AdminSubscriptionFilter;
  ownerAddress?: Address;
  page: number;
  pageSize?: number;
}

export const useAdminSubscriptions = ({ filter, ownerAddress, page, pageSize = 25 }: AdminSubscriptionsListParams) => {
  const searchParams = new URLSearchParams({ filter, page: String(page), pageSize: String(pageSize) });
  if (ownerAddress) searchParams.set('owner', ownerAddress);

  return useAdminQuery<AdminSubscriptionsPage>(
    ['admin', 'subscriptions', { filter, ownerAddress, page, pageSize }],
    '/api/admin/subscriptions',
    { searchParams, placeholderData: keepPreviousData },
  );
};

export const useAdminSubscription = (subscriptionId: string) => {
  return useAdminQuery<AdminSubscriptionDetail>(
    ['admin', 'subscriptions', subscriptionId],
    `/api/admin/subscriptions/${subscriptionId}`,
  );
};

export const useAdminSubscriptionBudget = (subscriptionId: string) => {
  return useAdminQuery<SerializedMonthlyBudget>(
    ['admin', 'subscriptions', subscriptionId, 'budget'],
    `/api/admin/subscriptions/${subscriptionId}/budget`,
  );
};

export const useAdminSubscriptionPermissions = (subscriptionId: string) => {
  return useAdminQuery<AutoRevokePermission[]>(
    ['admin', 'subscriptions', subscriptionId, 'permissions'],
    `/api/admin/subscriptions/${subscriptionId}/permissions`,
  );
};

export const useAdminSubscriptionRules = (subscriptionId: string) => {
  return useAdminQuery<AutoRevokeRules>(
    ['admin', 'subscriptions', subscriptionId, 'rules'],
    `/api/admin/subscriptions/${subscriptionId}/rules`,
  );
};

export const useRebuildSubscription = (subscriptionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ky.post(`/api/admin/subscriptions/${subscriptionId}/rebuild`).json<{ ok: boolean }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      toast.success('Subscription rebuilt from payments');
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) || 'Failed to rebuild subscription');
    },
  });
};

export const useReconcilePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) =>
      ky
        .post(`/api/admin/payments/${paymentId}/reconcile`)
        .json<{ paymentId: string; status: string; matchedTxHash: string | null }>(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      if (result.status === 'confirmed') {
        toast.success('Payment confirmed against a matching transfer');
      } else {
        toast.warn(`No matching transfer found, payment is now ${result.status}`);
      }
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) || 'Failed to reconcile payment');
    },
  });
};
