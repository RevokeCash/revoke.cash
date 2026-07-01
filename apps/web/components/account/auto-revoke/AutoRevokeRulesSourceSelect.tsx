'use client';

import type { AddressRulesConfig, RulesSource } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import Select from 'components/common/select/Select';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface Props {
  rulesSource: RulesSource;
  availableSubscriptions: AddressRulesConfig['availableSubscriptions'];
  onSwitchRulesSource: (params: { subscriptionId: string | null }) => void;
  isSwitching: boolean;
}

interface RulesSourceOption {
  value: string;
  label: string;
}

const AutoRevokeRulesSourceSelect = ({
  rulesSource,
  availableSubscriptions,
  onSwitchRulesSource,
  isSwitching,
}: Props) => {
  const t = useTranslations();

  const currentValue = rulesSource.type === 'custom' ? 'custom' : rulesSource.subscriptionId;

  const options = useMemo<RulesSourceOption[]>(() => {
    const customOption: RulesSourceOption = {
      value: 'custom',
      label: t('account.auto_revoke.rules_source.custom'),
    };

    const subscriptionOptions = availableSubscriptions.map((subscription) => ({
      value: subscription.subscriptionId,
      label: t('account.auto_revoke.rules_source.subscription_defaults', {
        owner: shortenAddress(subscription.ownerAddress, 4),
      }),
    }));

    return [customOption, ...subscriptionOptions];
  }, [availableSubscriptions, t]);

  const selectedOption = options.find((option) => option.value === currentValue) ?? options[0];

  const handleChange = (option: RulesSourceOption | null) => {
    if (!option) return;
    onSwitchRulesSource({ subscriptionId: option.value === 'custom' ? null : option.value });
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        {t('account.auto_revoke.rules_source.title')}
      </h3>
      <Select<RulesSourceOption, false, never>
        options={options}
        value={selectedOption}
        onChange={handleChange}
        isDisabled={isSwitching}
        isSearchable={false}
        getOptionValue={(option) => option.value}
        getOptionLabel={(option) => option.label}
      />
    </div>
  );
};

export default AutoRevokeRulesSourceSelect;
