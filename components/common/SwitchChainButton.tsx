import { useEthereum } from 'lib/hooks/useEthereum';
import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';
import { Button } from 'react-bootstrap';

const SwitchChainButton = () => {
  const { t } = useTranslation();
  const { selectedChainId, connectionType, switchInjectedWalletChain } = useEthereum();
  const canSwitchChain = connectionType === 'injected';

  const { execute, loading } = useAsyncCallback(() => switchInjectedWalletChain(selectedChainId));

  const button = (
    <Button size="sm" disabled={loading || !canSwitchChain} className="RevokeButton" onClick={execute}>
      {loading ? t('common:buttons.switching') : t('common:buttons.switch_chain')}
    </Button>
  );

  return button;
};

export default SwitchChainButton;
