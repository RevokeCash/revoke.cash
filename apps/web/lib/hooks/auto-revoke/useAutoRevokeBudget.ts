import type { MonthlyBudget } from '@revoke.cash/core/auto-revoke/execution/budget';
import { isNullish } from '@revoke.cash/core/utils';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import ky from 'lib/ky';

// The wire shape of MonthlyBudget: JSON serialization turns the period dates into ISO strings.
export type SerializedMonthlyBudget = Omit<MonthlyBudget, 'period'> & { period: { start: string; end: string } };

// The budget of a single subscription, viewable by its owner only
export const useSubscriptionAutoRevokeBudget = (subscriptionId: string | undefined, enabled: boolean) => {
  const query = useQuery({
    queryKey: ['auto-revoke', 'budget', 'subscription', subscriptionId],
    queryFn: () => ky.get(`/api/auto-revoke/subscriptions/${subscriptionId}/budget`).json<SerializedMonthlyBudget>(),
    staleTime: MINUTE,
    enabled: enabled && !isNullish(subscriptionId),
  });

  return { budget: query.data, isLoading: query.isLoading };
};

// The aggregate budget available to the connected address across all subscriptions that cover it.
export const useAddressAutoRevokeBudget = (enabled: boolean) => {
  const { siweAddress } = useAuthSession();

  const query = useQuery({
    queryKey: ['auto-revoke', 'budget', 'address', siweAddress],
    queryFn: () => ky.get('/api/auto-revoke/budget').json<SerializedMonthlyBudget | null>(),
    staleTime: MINUTE,
    enabled: enabled && !isNullish(siweAddress),
  });

  return { budget: query.data ?? undefined, isLoading: query.isLoading };
};
