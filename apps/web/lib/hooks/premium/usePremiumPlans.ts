import type { PremiumPlan } from '@revoke.cash/core/premium/types';
import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import { useMemo } from 'react';

const PLANS_QUERY_KEY = ['premium', 'plans'] as const;

export const usePremiumPlans = (selectedPlanId: string) => {
  const plansQuery = useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: async () => {
      const response = await ky.get('/api/premium/plans').json<{ plans: PremiumPlan[] }>();
      return response.plans;
    },
    staleTime: 5 * 60 * 1000,
  });

  const selectedPlan = useMemo(() => {
    return plansQuery.data?.find((plan) => plan.id === selectedPlanId) ?? null;
  }, [plansQuery.data, selectedPlanId]);

  return {
    plans: plansQuery.data ?? [],
    selectedPlan,
    isLoading: plansQuery.isLoading,
    isError: plansQuery.isError,
  };
};
