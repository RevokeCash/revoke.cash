import Button from 'components/common/Button';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';
import { useAccount, useSwitchNetwork } from 'wagmi';

const SwitchChainButton = () => {
  const { t } = useTranslation();
  const { selectedChainId } = useAddressPageContext();
  const { connector } = useAccount();
  const { switchNetwork } = useSwitchNetwork();
  const canSwitchChain = connector?.id === 'injected';

  const { execute, loading } = useAsyncCallback(() => switchNetwork(selectedChainId));

  const button = (
    <Button style="secondary" size="sm" disabled={!canSwitchChain} loading={loading} onClick={execute}>
      {loading ? t('common:buttons.switching') : t('common:buttons.switch_chain')}
    </Button>
  );

  return button;
};

export default SwitchChainButton;
