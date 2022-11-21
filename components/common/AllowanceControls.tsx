import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainName } from 'lib/utils/chains';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import RevokeButton from './RevokeButton';
import SwitchChainButton from './SwitchChainButton';
import UpdateControls from './UpdateControls';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  revoke: () => Promise<void>;
  update?: (newAllowance: string) => Promise<void>;
  id: string;
}

const AllowanceControls = ({ revoke, update, id }: Props) => {
  const { t } = useTranslation();
  const { account, selectedChainId, connectedChainId, connectionType } = useEthereum();
  const { inputAddress } = useAppContext();

  const chainName = getChainName(selectedChainId);

  const isConnected = account !== undefined;
  const isConnectedAddress = isConnected && inputAddress === account;
  const needsToSwitchChain = isConnected && selectedChainId !== connectedChainId;
  const canSwitchChain = connectionType === 'injected';
  const disabled = !isConnectedAddress || (needsToSwitchChain && !canSwitchChain);

  if (needsToSwitchChain && canSwitchChain) {
    return <SwitchChainButton />;
  }

  const controls = (
    <div className="flex h-6 gap-1">
      <RevokeButton revoke={revoke} disabled={disabled} />
      {update && <UpdateControls update={update} disabled={disabled} />}
    </div>
  );

  if (!isConnected) {
    return <WithHoverTooltip tooltip={t('dashboard:controls.tooltips.connect_wallet')}>{controls}</WithHoverTooltip>;
  }

  if (!isConnectedAddress) {
    return <WithHoverTooltip tooltip={t('dashboard:controls.tooltips.connected_account')}>{controls}</WithHoverTooltip>;
  }

  if (needsToSwitchChain && !canSwitchChain) {
    const tooltip = (
      <Trans i18nKey={`dashboard:controls.tooltips.switch_chain`} values={{ chainName }} components={[<strong />]} />
    );
    return <WithHoverTooltip tooltip={tooltip}>{controls}</WithHoverTooltip>;
  }

  return controls;
};

export default AllowanceControls;
