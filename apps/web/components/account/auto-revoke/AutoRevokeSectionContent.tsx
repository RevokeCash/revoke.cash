'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import type { AutoRevokeRules } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import type { AutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import Divider from 'components/common/Divider';
import type { useAddressAutoRevokeRules } from 'lib/hooks/auto-revoke/useAutoRevokeRules';
import { useErc7715Support } from 'lib/hooks/auto-revoke/useErc7715Support';
import { useTranslations } from 'next-intl';
import { type Address, isAddressEqual } from 'viem';
import AutoRevokePermissions from './AutoRevokePermissions';
import AutoRevokeRulesEditor from './AutoRevokeRulesEditor';
import AutoRevokeRulesSourceSelect from './AutoRevokeRulesSourceSelect';
import MetaMaskRequiredBanner from './MetaMaskRequiredBanner';

interface Props {
  account: Address;
  addresses: Address[];
  permissions: AutoRevokePermission[];
  isAdmin: boolean;
  addressRules: ReturnType<typeof useAddressAutoRevokeRules>;
  effectiveRules: AutoRevokeRules | null;
  updateRules: (rules: Partial<AutoRevokeRules>) => void;
  isPreview?: boolean;
}

const AutoRevokeSectionContent = ({
  account,
  addresses,
  permissions,
  isAdmin,
  addressRules,
  effectiveRules,
  updateRules,
  isPreview = false,
}: Props) => {
  const t = useTranslations();
  const { supportsErc7715 } = useErc7715Support();

  const isUsingSubscriptionDefaults = !isAdmin && addressRules.rulesSource?.type === 'subscription';

  const managedByLabel =
    isUsingSubscriptionDefaults && addressRules.rulesSource?.type === 'subscription'
      ? t('account.auto_revoke.rules.managed_by', { owner: shortenAddress(addressRules.rulesSource.ownerAddress, 4) })
      : undefined;

  const connectedWalletNeedsSetup = !permissions.some(
    (permission) => isAddressEqual(permission.address, account) && permission.isActive,
  );

  return (
    <div className="flex flex-col gap-4">
      {!supportsErc7715 && !isPreview && <MetaMaskRequiredBanner />}

      {connectedWalletNeedsSetup && !isPreview && (
        <div className="rounded-lg border border-brand/50 bg-brand/5 p-4 flex items-center gap-3">
          <InformationCircleIcon className="h-6 w-6 shrink-0 text-brand" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.auto_revoke.setup.get_started')}</p>
        </div>
      )}

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
  );
};

export default AutoRevokeSectionContent;
