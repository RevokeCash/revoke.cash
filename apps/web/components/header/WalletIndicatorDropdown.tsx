import { useQueryClient } from '@tanstack/react-query';
import DropdownMenu, { DropdownMenuItem } from 'components/common/DropdownMenu';
import { AUTH_SESSION_QUERY_KEY } from 'lib/auth/session';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import ky from 'lib/ky';
import { shortenAddress } from 'lib/utils/formatting';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useConnection, useDisconnect } from 'wagmi';
import ConnectButton from './ConnectButton';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
}

const WalletIndicatorDropdown = ({ size, style, className }: Props) => {
  const t = useTranslations();
  const pathname = usePathname();

  const queryClient = useQueryClient();
  const { address: account } = useConnection();
  const { domainName } = useNameLookup(account);
  const { mutate: disconnect } = useDisconnect();

  const isLandingPage = pathname === '/' || /^\/[a-z]{2}$/.test(pathname);

  const handleDisconnect = async () => {
    await ky.post('/api/auth/logout').catch(() => {});
    queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
    disconnect();
  };

  return (
    <div className="flex whitespace-nowrap">
      {account ? (
        <DropdownMenu menuButton={domainName ?? shortenAddress(account, 4)}>
          <DropdownMenuItem href={`/address/${account}`} router retainSearchParams={['chainId']}>
            {t('common.buttons.my_allowances')}
          </DropdownMenuItem>
          <DropdownMenuItem href="/account" router>
            {t('common.buttons.my_account')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDisconnect}>{t('common.buttons.disconnect')}</DropdownMenuItem>
        </DropdownMenu>
      ) : (
        <ConnectButton size={size} style={style} className={className} redirect={isLandingPage} />
      )}
    </div>
  );
};

export default WalletIndicatorDropdown;
