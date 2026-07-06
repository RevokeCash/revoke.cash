import type { MonthlyBudget } from '@revoke.cash/core/auto-revoke/execution/budget';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';

// The wire shape of MonthlyBudget: JSON serialization turns the period dates into ISO strings.
export type SerializedMonthlyBudget = Omit<MonthlyBudget, 'period'> & { period: { start: string; end: string } };

export const useAutoRevokeBudget = (subscriptionId: string | undefined, enabled: boolean) => {
  const query = useQuery({
    queryKey: ['auto-revoke', 'budget', subscriptionId],
    queryFn: () => ky.get(`/api/auto-revoke/subscriptions/${subscriptionId}/budget`).json<SerializedMonthlyBudget>(),
    staleTime: MINUTE,
    enabled: enabled && Boolean(subscriptionId),
  });

  return { budget: query.data, isLoading: query.isLoading };
};
