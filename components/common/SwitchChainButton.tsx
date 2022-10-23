import { useEthereum } from 'lib/hooks/useEthereum';
import { Button } from 'react-bootstrap';

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
