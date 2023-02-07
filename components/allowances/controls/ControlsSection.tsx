import RevokeButton from 'components/allowances/controls/RevokeButton';
import { useAddressContext } from 'lib/hooks/useAddressContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { AllowanceData } from 'lib/interfaces';
import { getAllowanceI18nValues } from 'lib/utils/allowances';
import ControlsWrapper from './ControlsWrapper';
import SwitchChainButton from './SwitchChainButton';
import UpdateControls from './UpdateControls';

interface Props {
  allowance: AllowanceData;
  update?: (newAmount?: string) => Promise<void>;
  reset?: () => void;
  revoke?: () => Promise<void>;
}

const ControlsSection = ({ allowance, revoke, update, reset }: Props) => {
  const { account, selectedChainId, connectedChainId, connectionType } = useEthereum();
  const { address } = useAddressContext();

  // TODO: Remove this WET code (alwo in ControlsWrapper.tsx)
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

  return (
    <ControlsWrapper>
      <div className="controls-section">
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
    </ControlsWrapper>
  );
};

export default ControlsSection;
