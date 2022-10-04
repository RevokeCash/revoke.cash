import React from 'react';
import { Tooltip } from 'react-bootstrap';
import { useEthereum } from 'utils/hooks/useEthereum';
import RevokeButton from './RevokeButton';
import SwitchChainButton from './SwitchChainButton';
import UpdateControls from './UpdateControls';
import { getChainName } from './util';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  revoke: () => Promise<void>;
  update?: (newAllowance: string) => Promise<void>;
  inputAddress: string;
  id: string;
}

const AllowanceControls = ({ inputAddress, revoke, update, id }: Props) => {
  const { account, selectedChainId, connectedChainId, connectionType } = useEthereum();

  const isConnected = account !== undefined;
  const isConnectedAddress = isConnected && inputAddress === account;
  const needsToSwitchChain = isConnected && selectedChainId !== connectedChainId;
  const canSwitchChain = connectionType === 'injected';
  const disabled = !isConnectedAddress || (needsToSwitchChain && !canSwitchChain);

  if (needsToSwitchChain && canSwitchChain) {
    return <SwitchChainButton />;
  }

  const revokeButton = <RevokeButton revoke={revoke} disabled={disabled} />;
  const updateControls = <UpdateControls update={update} disabled={disabled} />;
  const controls = (
    <div style={{ display: 'flex' }}>
      {revokeButton}
      {update && updateControls}
    </div>
  );

  if (!isConnected) {
    const tooltip = <Tooltip id={`revoke-${id}`}>Please connect your wallet in order to revoke</Tooltip>;
    return <WithHoverTooltip tooltip={tooltip}>{controls}</WithHoverTooltip>;
  }

  if (!isConnectedAddress) {
    const tooltip = <Tooltip id={`revoke-${id}`}>You can only revoke allowances of the connected account</Tooltip>;
    return <WithHoverTooltip tooltip={tooltip}>{controls}</WithHoverTooltip>;
  }

  if (needsToSwitchChain && !canSwitchChain) {
    const tooltip = (
      <Tooltip id={`switch-${id}`}>
        Please switch your connected network to <strong>{getChainName(selectedChainId)}</strong> inside your wallet in
        order to revoke
      </Tooltip>
    );

    return <WithHoverTooltip tooltip={tooltip}>{controls}</WithHoverTooltip>;
  }

  return controls;
};

export default AllowanceControls;
