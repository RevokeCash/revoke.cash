'use client';

import type { PremiumSubscription } from '@revoke.cash/core/premium/subscriptions';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import Card, { CardTitle } from 'components/common/Card';
import Divider from 'components/common/Divider';
import {
  useAddressAutoRevokePermissions,
  useSubscriptionAutoRevokePermissions,
} from 'lib/hooks/auto-revoke/useAutoRevokePermissions';
import { useAddressAutoRevokeRules, useSubscriptionAutoRevokeRules } from 'lib/hooks/auto-revoke/useAutoRevokeRules';
import { useTranslations } from 'next-intl';
import { type Address, isAddressEqual } from 'viem';
import { useConnection } from 'wagmi';
import AutoRevokePermissions from './AutoRevokePermissions';
import AutoRevokeRulesEditor from './AutoRevokeRulesEditor';
import AutoRevokeRulesSourceSelect from './AutoRevokeRulesSourceSelect';
import MetaMaskRequiredBanner from './MetaMaskRequiredBanner';

interface Props {
  activeSubscription?: PremiumSubscription;
  account: Address;
}

const AutoRevokeSection = ({ activeSubscription, account }: Props) => {
  const t = useTranslations();
  const { connector } = useConnection();
  const isMetaMask = connector?.id === 'io.metamask';
  const isAdmin = Boolean(activeSubscription && isAddressEqual(account, activeSubscription.ownerAddress));

  const subscriptionPermissions = useSubscriptionAutoRevokePermissions(activeSubscription?.id, isAdmin);
  const addressPermissions = useAddressAutoRevokePermissions(account, !isAdmin);

  const subscriptionRules = useSubscriptionAutoRevokeRules(activeSubscription?.id, isAdmin);
  const addressRules = useAddressAutoRevokeRules(account, !isAdmin);

  const isAdminLoading = isAdmin && (subscriptionPermissions.isLoading || subscriptionRules.isLoading);
  const isUserLoading = !isAdmin && (addressPermissions.isLoading || addressRules.isLoading);
  const isLoading = isAdminLoading || isUserLoading;

  const { permissions } = isAdmin ? subscriptionPermissions : addressPermissions;
  const { effectiveRules, updateRules } = isAdmin ? subscriptionRules : addressRules;
  const isUsingSubscriptionDefaults = !isAdmin && addressRules.rulesSource?.type === 'subscription';
  const addresses = activeSubscription?.addresses ?? [account];

  const managedByLabel =
    isUsingSubscriptionDefaults && addressRules.rulesSource?.type === 'subscription'
      ? t('account.auto_revoke.rules.managed_by', { owner: shortenAddress(addressRules.rulesSource.ownerAddress, 4) })
      : undefined;

  return (
    <Card
      header={<CardTitle title={t('account.auto_revoke.title')} />}
      isLoading={isLoading}
      className={isLoading ? 'h-48' : undefined}
    >
      <div className="flex flex-col gap-4">
        {!isMetaMask && <MetaMaskRequiredBanner />}

        <div className="grid gap-6 lg:grid-cols-2">
          <AutoRevokePermissions
            addresses={addresses}
            connectedAddress={account}
            permissions={permissions}
            isAdmin={isAdmin}
          />

          <div className="min-w-0 flex flex-col gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-6">
            {!isAdmin && addressRules.rulesSource && (
              <>
                <AutoRevokeRulesSourceSelect
                  rulesSource={addressRules.rulesSource}
                  availableSubscriptions={addressRules.availableSubscriptions}
                  onSwitchRulesSource={addressRules.switchRulesSource}
                  isSwitching={addressRules.isSwitchingRulesSource}
                />
                <Divider />
              </>
            )}

            {effectiveRules && (
              <AutoRevokeRulesEditor
                rules={effectiveRules}
                onUpdate={updateRules}
                isAdmin={isAdmin}
                readOnly={isUsingSubscriptionDefaults}
                managedByLabel={managedByLabel}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AutoRevokeSection;
