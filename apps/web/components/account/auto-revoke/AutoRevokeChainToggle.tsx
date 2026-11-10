'use client';

import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import type { AutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import ChainDisplay from 'components/common/ChainDisplay';
import Toggle from 'components/common/Toggle';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useTranslations } from 'next-intl';

interface Props {
  chainId: number;
  activePermission?: AutoRevokePermission;
  isConnected: boolean;
  isSupported: boolean;
  isPending: boolean;
  isPendingForThisChain: boolean;
  onToggle: (enabled: boolean) => void;
}

const AutoRevokeChainToggle = ({
  chainId,
  activePermission,
  isConnected,
  isSupported,
  isPending,
  isPendingForThisChain,
  onToggle,
}: Props) => {
  const t = useTranslations();

  const disabledTooltipKey = getDisabledTooltipKey(isConnected, isSupported);
  const needsAccountUpgrade = activePermission ? !activePermission.accountUpgraded : false;

  const toggle = (
    <Toggle
      pending={isPendingForThisChain}
      checked={Boolean(activePermission)}
      onChange={onToggle}
      disabled={isPending || !isConnected || !isSupported}
      size="sm"
    />
  );

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <ChainDisplay chainId={chainId} logoSize={20} className="text-zinc-700 dark:text-zinc-300" />
      <div className="flex items-center gap-1.5">
        {needsAccountUpgrade && (
          <WithHoverTooltip tooltip={t('account.auto_revoke.permissions.account_not_upgraded')}>
            <button type="button" aria-label="Smart account upgrade needed" className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
            </button>
          </WithHoverTooltip>
        )}
        {disabledTooltipKey ? <WithHoverTooltip tooltip={t(disabledTooltipKey)}>{toggle}</WithHoverTooltip> : toggle}
      </div>
    </div>
  );
};

const getDisabledTooltipKey = (isConnected: boolean, isSupported: boolean) => {
  if (!isConnected) return 'account.auto_revoke.permissions.connect_to_manage';
  if (!isSupported) return 'account.auto_revoke.smart_account_unsupported';
  return null;
};

export default AutoRevokeChainToggle;
