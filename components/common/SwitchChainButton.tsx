import React from 'react';
import { Button } from 'react-bootstrap';
import { useEthereum } from 'utils/hooks/useEthereum';

const SwitchChainButton = () => {
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

  return button;
};

export default SwitchChainButton;
