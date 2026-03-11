import Button from 'components/common/Button';
import { useSwitchChain } from 'lib/hooks/ethereum/useSwitchChain';
import { useTranslations } from 'next-intl';
import { useAsyncCallback } from 'react-async-hook';

interface Props {
  chainId: number;
  size: 'sm' | 'md' | 'lg';
}

const SwitchChainButton = ({ chainId, size }: Props) => {
  const t = useTranslations();
  const { switchChainAsync } = useSwitchChain();

  const { execute, loading } = useAsyncCallback(() => switchChainAsync(chainId));

  const button = (
    <Button style="secondary" size={size} loading={loading} onClick={execute}>
      {loading ? t('common.buttons.switching') : t('common.buttons.switch_chain')}
    </Button>
  );

  return button;
};

export default SwitchChainButton;
