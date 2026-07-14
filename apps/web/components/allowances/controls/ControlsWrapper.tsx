import { isNullish } from '@revoke.cash/core/utils';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';
import { useConnection } from 'wagmi';

interface Props {
  address: string;
  children: (disabled: boolean) => ReactElement;
  overrideDisabled?: boolean;
  disabledReason?: string;
}

const ControlsWrapper = ({ address, children, overrideDisabled, disabledReason }: Props) => {
  const t = useTranslations();
  const { address: account } = useConnection();

  const isConnected = !isNullish(account);
  const isConnectedAddress = isConnected && address === account;
  const disabled = !isConnectedAddress || Boolean(overrideDisabled);

  if (!isConnected) {
    return <WithHoverTooltip tooltip={t('address.tooltips.connect_wallet')}>{children(disabled)}</WithHoverTooltip>;
  }

  if (!isConnectedAddress) {
    return <WithHoverTooltip tooltip={t('address.tooltips.connected_account')}>{children(disabled)}</WithHoverTooltip>;
  }

  if (overrideDisabled && disabledReason) {
    return <WithHoverTooltip tooltip={disabledReason}>{children(disabled)}</WithHoverTooltip>;
  }

  return <>{children(disabled)}</>;
};

export default ControlsWrapper;
