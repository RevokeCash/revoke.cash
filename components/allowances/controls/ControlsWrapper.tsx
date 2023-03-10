import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { getChainName } from 'lib/utils/chains';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import { ReactElement } from 'react';
import { useAccount, useNetwork } from 'wagmi';

interface Props {
  children?: ReactElement;
}

const ControlsWrapper = ({ children }: Props) => {
  const { t } = useTranslation();
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const { address, selectedChainId } = useAddressPageContext();

  const chainName = getChainName(selectedChainId);

  const isConnected = account !== undefined;
  const isConnectedAddress = isConnected && address === account;
  const needsToSwitchChain = isConnected && selectedChainId !== chain?.id;

  if (!isConnected) {
    return <WithHoverTooltip tooltip={t('address:tooltips.connect_wallet')}>{children}</WithHoverTooltip>;
  }

  if (!isConnectedAddress) {
    return <WithHoverTooltip tooltip={t('address:tooltips.connected_account')}>{children}</WithHoverTooltip>;
  }

  if (needsToSwitchChain) {
    const tooltip = (
      <Trans i18nKey={`address:tooltips.switch_chain`} values={{ chainName }} components={[<strong />]} />
    );

    return <WithHoverTooltip tooltip={tooltip}>{children}</WithHoverTooltip>;
  }

  return children;
};

export default ControlsWrapper;
