import { useQuery } from '@tanstack/react-query';
import type { AutoRevokeAddressRulesConfig, AutoRevokeRules } from 'lib/auto-revoke/types';
import { useOptimisticMutation } from 'lib/hooks/useOptimisticMutation';
import ky from 'lib/ky';
import { isNullish } from 'lib/utils';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';

const getSubscriptionRulesQueryKey = (subscriptionId?: string) =>
  ['auto-revoke', 'subscription-rules', subscriptionId] as const;

const getAddressRulesConfigQueryKey = (address: Address) => ['auto-revoke', 'address-rules-config', address] as const;

export const useSubscriptionAutoRevokeRules = (subscriptionId: string | undefined, enabled: boolean) => {
  const t = useTranslations();
  const queryKey = getSubscriptionRulesQueryKey(subscriptionId);

  const query = useQuery({
    queryKey,
    queryFn: async () => ky.get(`/api/auto-revoke/subscriptions/${subscriptionId}/rules`).json<AutoRevokeRules>(),
    enabled: enabled && !isNullish(subscriptionId),
  });

  const updateRulesMutation = useOptimisticMutation<Partial<AutoRevokeRules>, { ok: boolean }, AutoRevokeRules>({
    queryKey,
    mutationFn: async (ruleData) => {
      return ky.put(`/api/auto-revoke/subscriptions/${subscriptionId}/rules`, { json: ruleData }).json();
    },
    applyOptimisticUpdate: (previous, ruleData) => ({ ...previous, ...ruleData }),
    errorMessage: t('account.auto_revoke.rules.save_failed'),
  });

  return {
    effectiveRules: query.data ?? null,
    isLoading: query.isLoading,
    updateRules: updateRulesMutation.mutate,
    isUpdating: updateRulesMutation.isPending,
  };
};

interface SwitchRulesSourceParams {
  subscriptionId: string | null;
}

export const useAddressAutoRevokeRules = (address: Address, enabled: boolean) => {
  const t = useTranslations();
  const queryKey = getAddressRulesConfigQueryKey(address);

  const query = useQuery({
    queryKey,
    queryFn: async () => ky.get('/api/auto-revoke/rules-config').json<AutoRevokeAddressRulesConfig>(),
    enabled,
  });

  const switchRulesSourceMutation = useOptimisticMutation<
    SwitchRulesSourceParams,
    { ok: boolean },
    AutoRevokeAddressRulesConfig
  >({
    queryKey,
    mutationFn: async (params) => {
      return ky.put('/api/auto-revoke/rules-config', { json: params }).json();
    },
    applyOptimisticUpdate: (previous, params) => {
      // Switching to custom: use the address's stored custom rules as effective
      if (params.subscriptionId === null) {
        return { ...previous, rulesSource: { type: 'custom' }, effectiveRules: previous.customRules };
      }

      // Switching to a subscription: look up the target in availableSubscriptions
      const targetSubscription = previous.availableSubscriptions.find(
        (subscription) => subscription.subscriptionId === params.subscriptionId,
      );
      if (!targetSubscription) return previous;

      return {
        ...previous,
        rulesSource: {
          type: 'subscription',
          subscriptionId: targetSubscription.subscriptionId,
          planName: targetSubscription.planName,
          ownerAddress: targetSubscription.ownerAddress,
        },
      };
    },
    errorMessage: t('account.auto_revoke.rules_source.switch_failed'),
  });

  const updateRulesMutation = useOptimisticMutation<
    Partial<AutoRevokeRules>,
    { ok: boolean },
    AutoRevokeAddressRulesConfig
  >({
    queryKey,
    mutationFn: (ruleData) => ky.put('/api/auto-revoke/rules', { json: ruleData }).json(),
    applyOptimisticUpdate: (previous, ruleData) => ({
      ...previous,
      effectiveRules: { ...previous.effectiveRules, ...ruleData },
      customRules: { ...previous.customRules, ...ruleData },
    }),
    errorMessage: t('account.auto_revoke.rules.save_failed'),
  });

  return {
    effectiveRules: query.data?.effectiveRules ?? null,
    customRules: query.data?.customRules ?? null,
    rulesSource: query.data?.rulesSource ?? null,
    availableSubscriptions: query.data?.availableSubscriptions ?? [],
    isLoading: query.isLoading,
    switchRulesSource: switchRulesSourceMutation.mutate,
    isSwitchingRulesSource: switchRulesSourceMutation.isPending,
    updateRules: updateRulesMutation.mutate,
    isUpdating: updateRulesMutation.isPending,
  };
};
