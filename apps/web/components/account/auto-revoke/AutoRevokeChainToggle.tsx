'use client';

import ChainDisplay from 'components/common/ChainDisplay';
import Toggle from 'components/common/Toggle';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useTranslations } from 'next-intl';

interface Props {
  chainId: number;
  isGranted: boolean;
  isConnected: boolean;
  isPending: boolean;
  isPendingForThisChain: boolean;
  onToggle: (enabled: boolean) => void;
}

const AutoRevokeChainToggle = ({
  chainId,
  isGranted,
  isConnected,
  isPending,
  isPendingForThisChain,
  onToggle,
}: Props) => {
  const t = useTranslations();

  const toggle = (
    <Toggle
      pending={isPendingForThisChain}
      checked={isGranted}
      onChange={onToggle}
      disabled={isPending || !isConnected}
      size="sm"
    />
  );

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <ChainDisplay chainId={chainId} logoSize={20} className="text-zinc-700 dark:text-zinc-300" />
      {!isConnected ? (
        <WithHoverTooltip tooltip={t('account.auto_revoke.permissions.connect_to_manage')}>{toggle}</WithHoverTooltip>
      ) : (
        toggle
      )}
    </div>
  );
};

export default AutoRevokeChainToggle;
