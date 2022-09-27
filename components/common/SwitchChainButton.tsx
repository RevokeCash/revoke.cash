import React from 'react';
import { Button, Tooltip } from 'react-bootstrap';
import { useEthereum } from 'utils/hooks/useEthereum';
import { getChainName } from './util';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  id: string;
}

const SwitchChainButton = ({ id }: Props) => {
  const { selectedChainId, connectionType, switchInjectedWalletChain } = useEthereum();
  const canSwitchChain = connectionType === 'injected';

  const button = (
    <Button
      size="sm"
      disabled={!canSwitchChain}
      className="RevokeButton"
      onClick={() => switchInjectedWalletChain(selectedChainId)}
    >
      Switch chain
    </Button>
  );

  // Add tooltip if the button is disabled
  if (!canSwitchChain) {
    const tooltip = (
      <Tooltip id={`switch-${id}`}>
        Please switch your connected network to <strong>{getChainName(selectedChainId)}</strong> inside your wallet in
        order to revoke
      </Tooltip>
    );

    return <WithHoverTooltip tooltip={tooltip}>{button}</WithHoverTooltip>;
  }

  return button;
};

export default SwitchChainButton;
