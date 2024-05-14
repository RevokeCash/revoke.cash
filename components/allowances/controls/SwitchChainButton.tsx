import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';
import { useAsyncCallback } from 'react-async-hook';
import { useAccount, useSwitchChain } from 'wagmi';

interface Props {
  chainId: number;
  size: 'sm' | 'md' | 'lg';
}

const SwitchChainButton = ({ chainId, size }: Props) => {
  const t = useTranslations();
  const { connector } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const canSwitchChain = connector?.type === 'injected';

  const { execute, loading } = useAsyncCallback(() => switchChainAsync({ chainId }));

  const button = (
    <Button style="secondary" size={size} disabled={!canSwitchChain} loading={loading} onClick={execute}>
      {loading ? t('common.buttons.switching') : t('common.buttons.switch_chain')}
    </Button>
  );

  return button;
};

export default SwitchChainButton;
