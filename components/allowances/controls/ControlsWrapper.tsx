import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAddressContext } from 'lib/hooks/useAddressContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainName } from 'lib/utils/chains';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import { ReactElement } from 'react';

interface Props {
  children?: ReactElement;
}

const ControlsWrapper = ({ children }: Props) => {
  const { t } = useTranslation();
  const { account, selectedChainId, connectedChainId, connectionType } = useEthereum();
  const { address } = useAddressContext();

  const chainName = getChainName(selectedChainId);

  const isConnected = account !== undefined;
  const isConnectedAddress = isConnected && address === account;
  const needsToSwitchChain = isConnected && selectedChainId !== connectedChainId;

  if (!isConnected) {
    return <WithHoverTooltip tooltip={t('dashboard:controls.tooltips.connect_wallet')}>{children}</WithHoverTooltip>;
  }

  if (!isConnectedAddress) {
    return <WithHoverTooltip tooltip={t('dashboard:controls.tooltips.connected_account')}>{children}</WithHoverTooltip>;
  }

  if (needsToSwitchChain) {
    const tooltip = (
      <Trans i18nKey={`dashboard:controls.tooltips.switch_chain`} values={{ chainName }} components={[<strong />]} />
    );

    return <WithHoverTooltip tooltip={tooltip}>{children}</WithHoverTooltip>;
  }

  return children;
};

export default ControlsWrapper;
