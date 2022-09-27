import React from 'react';
import { Tooltip } from 'react-bootstrap';
import { useEthereum } from 'utils/hooks/useEthereum';
import RevokeButton from './RevokeButton';
import SwitchChainButton from './SwitchChainButton';
import UpdateControls from './UpdateControls';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  revoke: () => Promise<void>;
  update?: (newAllowance: string) => Promise<void>;
  inputAddress: string;
  id: string;
}

const AllowanceControls = ({ inputAddress, revoke, update, id }: Props) => {
  const { account, selectedChainId, chainId } = useEthereum();

  const isConnectedAddress = inputAddress === account;
  const needsToSwitchChain = selectedChainId !== chainId;
  const disabled = !isConnectedAddress;

  if (needsToSwitchChain) {
    return <SwitchChainButton id={id} />;
  }

  const revokeButton = <RevokeButton revoke={revoke} disabled={disabled} />;
  const updateControls = <UpdateControls update={update} disabled={disabled} />;
  const controls = (
    <div style={{ display: 'flex' }}>
      {revokeButton}
      {update && updateControls}
    </div>
  );

  if (disabled) {
    const tooltip = <Tooltip id={`revoke-${id}`}>You can only revoke allowances of the connected account</Tooltip>;
    return <WithHoverTooltip tooltip={tooltip}>{controls}</WithHoverTooltip>;
  }

  return controls;
};

export default AllowanceControls;
