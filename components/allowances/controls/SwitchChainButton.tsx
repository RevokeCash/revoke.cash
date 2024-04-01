import Button from 'components/common/Button';
import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';
import { useAccount, useSwitchChain } from 'wagmi';

interface Props {
  chainId: number;
  size: 'sm' | 'md' | 'lg';
}

const SwitchChainButton = ({ chainId, size }: Props) => {
  const { t } = useTranslation();
  const { connector } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const canSwitchChain = connector?.id === 'injected';

  const { execute, loading } = useAsyncCallback(() => switchChainAsync({ chainId }));

  const button = (
    <Button style="secondary" size={size} disabled={!canSwitchChain} loading={loading} onClick={execute}>
      {loading ? t('common:buttons.switching') : t('common:buttons.switch_chain')}
    </Button>
  );

  return button;
};

export default SwitchChainButton;
