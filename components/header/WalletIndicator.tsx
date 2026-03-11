'use client';

import Button from 'components/common/Button';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import { useConnection } from 'wagmi';
import WalletIndicatorDropdown from './WalletIndicatorDropdown';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
}

const WalletIndicator = ({ size, style, className }: Props) => {
  const t = useTranslations();
  const isMounted = useMounted();
  const { address: account, chainId } = useConnection();

  if (!isMounted) return null;

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-2 items-center">
      {account && (
        <Button
          className="font-normal"
          size={'md'}
          style={'secondary'}
          href={`/address/${account}?chainId=${chainId}`}
          router
          retainSearchParams={['chainId']}
        >
          {t('common.buttons.my_allowances')}
        </Button>
      )}
      <WalletIndicatorDropdown size={size} style={style} className={className} />
    </div>
  );
};

export default WalletIndicator;
