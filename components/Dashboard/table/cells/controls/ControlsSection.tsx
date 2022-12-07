import WithHoverTooltip from 'components/common/WithHoverTooltip';
import RevokeButton from 'components/Dashboard/table/cells/controls/RevokeButton';
import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { useRevoke } from 'lib/hooks/useRevoke';
import { AllowanceData } from 'lib/interfaces';
import { getChainName } from 'lib/utils/chains';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import SwitchChainButton from './SwitchChainButton';
import UpdateControls from './UpdateControls';

interface Props {
  allowance: AllowanceData;
  onUpdate: (allowance: AllowanceData, newAmount?: string) => void;
}

const ControlsSection = ({ allowance, onUpdate }: Props) => {
  const { t } = useTranslation();
  const { account, selectedChainId, connectedChainId, connectionType } = useEthereum();
  const { inputAddress } = useAppContext();
  const { revoke, update } = useRevoke(allowance, onUpdate);

  const chainName = getChainName(selectedChainId);

  const isConnected = account !== undefined;
  const isConnectedAddress = isConnected && inputAddress === account;
  const needsToSwitchChain = isConnected && selectedChainId !== connectedChainId;
  const canSwitchChain = connectionType === 'injected';
  const disabled = !isConnectedAddress || (needsToSwitchChain && !canSwitchChain);

  if (!allowance.spender) return null;

  if (needsToSwitchChain && canSwitchChain) {
    return <SwitchChainButton />;
  }

  const controls = (
    <div className="flex gap-1">
      <RevokeButton revoke={revoke} disabled={disabled} />
      {update && <UpdateControls update={update} disabled={disabled} />}
    </div>
  );

  if (!isConnected) {
    return (
      <WithHoverTooltip tooltip={t('dashboard:controls.tooltips.connect_wallet')} disabled>
        {controls}
      </WithHoverTooltip>
    );
  }

  if (!isConnectedAddress) {
    return (
      <WithHoverTooltip tooltip={t('dashboard:controls.tooltips.connected_account')} disabled>
        {controls}
      </WithHoverTooltip>
    );
  }

  if (needsToSwitchChain && !canSwitchChain) {
    const tooltip = (
      <Trans i18nKey={`dashboard:controls.tooltips.switch_chain`} values={{ chainName }} components={[<strong />]} />
    );
    return (
      <WithHoverTooltip tooltip={tooltip} disabled>
        {controls}
      </WithHoverTooltip>
    );
  }

  return controls;
};

export default ControlsSection;
