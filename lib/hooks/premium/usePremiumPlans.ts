import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import type { PlanSelectOption, PremiumPlan } from 'lib/premium/types';
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

  const planSelectOptions = useMemo<PlanSelectOption[]>(() => {
    return (plansQuery.data ?? []).map((plan) => ({
      value: plan.id,
      label: `${plan.name} - $${plan.priceUsd}/year`,
    }));
  }, [plansQuery.data]);

  const selectedPlanOption = useMemo(() => {
    return planSelectOptions.find((option) => option.value === selectedPlanId) ?? null;
  }, [planSelectOptions, selectedPlanId]);

  return {
    plans: plansQuery.data ?? [],
    selectedPlan,
    planSelectOptions,
    selectedPlanOption,
    isLoading: plansQuery.isLoading,
  };
};
