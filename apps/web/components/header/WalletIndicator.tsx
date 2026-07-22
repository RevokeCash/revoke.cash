'use client';

import { Cog6ToothIcon } from '@heroicons/react/24/outline';
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
  const { address: account } = useConnection();

  if (!isMounted) return null;

  return (
    <div className="flex flex-row-reverse lg:flex-row gap-2 items-center">
      {account && (
        <Button
          className="font-normal"
          size={'md'}
          style={'secondary'}
          href={`/address/${account}`}
          router
          retainSearchParams={['chainId']}
        >
          {t('common.buttons.my_allowances')}
        </Button>
      )}
      <WalletIndicatorDropdown size={size} style={style} className={className} />
      {account && (
        <Button
          size="md"
          style="secondary"
          href="/account"
          router
          className="w-9 px-0 justify-center"
          aria-label={t('common.buttons.my_account')}
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default WalletIndicator;
