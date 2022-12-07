import Button from 'components/common/Button';
import { useEthereum } from 'lib/hooks/useEthereum';
import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';

const SwitchChainButton = () => {
  const { t } = useTranslation();
  const { selectedChainId, connectionType, switchInjectedWalletChain } = useEthereum();
  const canSwitchChain = connectionType === 'injected';

  const { execute, loading } = useAsyncCallback(() => switchInjectedWalletChain(selectedChainId));

  const button = (
    <Button style="secondary" size="sm" disabled={loading || !canSwitchChain} onClick={execute}>
      {loading ? t('common:buttons.switching') : t('common:buttons.switch_chain')}
    </Button>
  );

  return button;
};

export default SwitchChainButton;
