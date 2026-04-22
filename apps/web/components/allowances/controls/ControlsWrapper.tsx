import RichText from 'components/common/RichText';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { isNullish } from 'lib/utils';
import { getChainName } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';
import { useAccount } from 'wagmi';
import SwitchChainButton from './SwitchChainButton';

interface Props {
  chainId: number;
  address: string;
  switchChainSize?: 'sm' | 'md' | 'lg';
  children: (disabled: boolean) => ReactElement;
  overrideDisabled?: boolean;
  disabledReason?: string;
  skipSwitchChain?: boolean;
}

const ControlsWrapper = ({
  chainId,
  address,
  switchChainSize,
  children,
  overrideDisabled,
  disabledReason,
  skipSwitchChain,
}: Props) => {
  const t = useTranslations();
  const { address: account, chain } = useAccount();

  const chainName = getChainName(chainId);

  const isConnected = !isNullish(account);
  const isConnectedAddress = isConnected && address === account;
  const needsToSwitchChain = isConnected && chainId !== chain?.id && !skipSwitchChain;
  const isChainSwitchEnabled = !isNullish(switchChainSize);
  const shouldRenderSwitchChainButton = needsToSwitchChain && isChainSwitchEnabled;
  const disabled =
    !isConnectedAddress || (needsToSwitchChain && !shouldRenderSwitchChainButton) || Boolean(overrideDisabled);

  if (shouldRenderSwitchChainButton) {
    return <SwitchChainButton chainId={chainId} size={switchChainSize} />;
  }

  if (!isConnected) {
    return <WithHoverTooltip tooltip={t('address.tooltips.connect_wallet')}>{children(disabled)}</WithHoverTooltip>;
  }

  if (!isConnectedAddress) {
    return <WithHoverTooltip tooltip={t('address.tooltips.connected_account')}>{children(disabled)}</WithHoverTooltip>;
  }

  if (needsToSwitchChain) {
    const tooltip = <RichText>{(tags) => t.rich('address.tooltips.switch_chain', { ...tags, chainName })}</RichText>;
    return <WithHoverTooltip tooltip={tooltip}>{children(disabled)}</WithHoverTooltip>;
  }

  if (overrideDisabled && disabledReason) {
    return <WithHoverTooltip tooltip={disabledReason}>{children(disabled)}</WithHoverTooltip>;
  }

  return <>{children(disabled)}</>;
};

export default ControlsWrapper;
