import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import RevokeButton from 'components/allowances/controls/RevokeButton';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
import { getDelegationKey, useRevokeDelegation } from 'lib/hooks/ethereum/delegations/useRevokeDelegation';

interface Props {
  delegation: Delegation;
  onRevoke: (delegation: Delegation) => void;
}

const ControlsCell = ({ delegation, onRevoke }: Props) => {
  const { revoke } = useRevokeDelegation(delegation, onRevoke);

  return (
    <div className="flex justify-end w-28 mr-0 mx-auto">
      <ControlsWrapper chainId={delegation.chainId} address={delegation.delegator} switchChainSize="sm">
        {(disabled) => (
          <div className="controls-section">
            <RevokeButton transactionKey={getDelegationKey(delegation)} revoke={revoke} disabled={disabled} />
          </div>
        )}
      </ControlsWrapper>
    </div>
  );
};

export default ControlsCell;
