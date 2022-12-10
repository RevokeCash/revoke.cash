import WithHoverTooltip from 'components/common/WithHoverTooltip';
import RevokeButton from 'components/Dashboard/table/cells/controls/RevokeButton';
import { useAddressContext } from 'lib/hooks/useAddressContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { AllowanceData } from 'lib/interfaces';
import { getAllowanceI18nValues } from 'lib/utils/allowances';
import { getChainName } from 'lib/utils/chains';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import SwitchChainButton from './SwitchChainButton';
import UpdateControls from './UpdateControls';

interface Props {
  allowance: AllowanceData;
  update?: (newAmount?: string) => Promise<void>;
  reset?: () => void;
  revoke?: () => Promise<void>;
}

const ControlsSection = ({ allowance, revoke, update, reset }: Props) => {
  const { t } = useTranslation();
  const { account, selectedChainId, connectedChainId, connectionType } = useEthereum();
  const { address } = useAddressContext();

  const chainName = getChainName(selectedChainId);

  const isConnected = account !== undefined;
  const isConnectedAddress = isConnected && address === account;
  const needsToSwitchChain = isConnected && selectedChainId !== connectedChainId;
  const canSwitchChain = connectionType === 'injected';
  const disabled = !isConnectedAddress || (needsToSwitchChain && !canSwitchChain);

  if (!allowance.spender) return null;

  if (needsToSwitchChain && canSwitchChain) {
    return <SwitchChainButton />;
  }

  const { amount } = getAllowanceI18nValues(allowance);
  const controls = (
    <div className="flex">
      {revoke && <RevokeButton revoke={revoke} disabled={disabled} />}
      {update && reset && (
        <UpdateControls
          update={update}
          disabled={disabled}
          reset={reset}
          defaultValue={amount === 'Unlimited' ? '0' : amount ?? '0'}
        />
      )}
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

export default ControlsSection;
