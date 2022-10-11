import { useEthereum } from 'lib/hooks/useEthereum';
import useTranslation from 'next-translate/useTranslation';
import { Button } from 'react-bootstrap';

const SwitchChainButton = () => {
  const { t } = useTranslation();
  const { selectedChainId, connectionType, switchInjectedWalletChain } = useEthereum();
  const canSwitchChain = connectionType === 'injected';

  const button = (
    <Button
      size="sm"
      disabled={!canSwitchChain}
      className="RevokeButton"
      onClick={() => switchInjectedWalletChain(selectedChainId)}
    >
      {t('common:buttons.switchChain')}
    </Button>
  );

  return button;
};

export default SwitchChainButton;
