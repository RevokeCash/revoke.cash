import DropdownMenu, { DropdownMenuItem } from 'components/common/DropdownMenu';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { shortenAddress } from 'lib/utils/formatting';
import { useTranslations } from 'next-intl';
import { useConnection, useDisconnect } from 'wagmi';
import ConnectButton from './ConnectButton';

// import { useSiwe } from 'lib/hooks/ethereum/siwe/useSiwe';
// import Spinner from 'components/common/Spinner';
// import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
}

const WalletIndicatorDropdown = ({ size, style, className }: Props) => {
  const t = useTranslations();

  const { address: account, chainId } = useConnection();
  const { domainName } = useNameLookup(account);
  const { mutate: disconnect } = useDisconnect();
  // const { siweAddress, isLoading: siweIsLoading, signIn } = useSiwe();

  return (
    <div className="flex whitespace-nowrap">
      {account ? (
        <DropdownMenu menuButton={domainName ?? shortenAddress(account, 4)}>
          <DropdownMenuItem href={`/address/${account}?chainId=${chainId}`} router retainSearchParams={['chainId']}>
            {t('common.buttons.my_allowances')}
          </DropdownMenuItem>
          {/* <DropdownMenuItem disabled={siweAddress || siweIsLoading} onClick={() => signIn()}>
            {siweIsLoading ? (
              <div className="flex gap-1 items-center">
                {t('common.buttons.authenticating')}
                <Spinner />
              </div>
            ) : siweAddress ? (
              <div className="flex gap-1 items-center">
                <CheckBadgeIcon className="w-4 h-4 text-brand bg-black shrink-0 rounded-full" />
                {t('common.buttons.authenticated')}
              </div>
            ) : (
              t('common.buttons.authenticate')
            )}
          </DropdownMenuItem> */}
          <DropdownMenuItem onClick={() => disconnect()}>{t('common.buttons.disconnect')}</DropdownMenuItem>
        </DropdownMenu>
      ) : (
        <ConnectButton size={size} style={style} className={className} redirect />
      )}
    </div>
  );
};

export default WalletIndicatorDropdown;
