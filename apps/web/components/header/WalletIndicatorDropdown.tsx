'use client';

import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import { useQueryClient } from '@tanstack/react-query';
import DropdownMenu, { DropdownMenuItem } from 'components/common/DropdownMenu';
import { AUTH_SESSION_QUERY_KEY, ENSURE_API_SESSION_QUERY_KEY } from 'lib/auth/session';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { useMounted } from 'lib/hooks/useMounted';
import ky from 'lib/ky';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useConnection, useDisconnect } from 'wagmi';
import ConnectButton from './ConnectButton';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
  compact?: boolean;
}

const WalletIndicatorDropdown = ({ size, style, className, compact }: Props) => {
  const t = useTranslations();
  const pathname = usePathname();
  const isMounted = useMounted();

  const queryClient = useQueryClient();
  const { address: account } = useConnection();
  const { domainName } = useNameLookup(account);
  const { mutate: disconnect } = useDisconnect();

  const isLandingPage = pathname === '/' || /^\/[a-z]{2}$/.test(pathname);

  const handleDisconnect = async () => {
    await ky.post('/api/auth/logout').catch(() => {});
    queryClient.removeQueries({ queryKey: ENSURE_API_SESSION_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
    disconnect();
  };

  if (!isMounted) return null;

  // Below 410px viewports the full "Connect Wallet" label does not fit next to the logo and menu button in all locales
  const connectText = compact ? (
    <>
      <span className="min-[410px]:hidden">{t('common.buttons.connect_short')}</span>
      <span className="hidden min-[410px]:inline">{t('common.buttons.connect')}</span>
    </>
  ) : undefined;

  const menuButton = compact ? (
    <span className="truncate max-w-20">{domainName ?? shortenAddress(account ?? '', 3)}</span>
  ) : (
    (domainName ?? shortenAddress(account ?? '', 4))
  );

  return (
    <div className="flex whitespace-nowrap">
      {account ? (
        <DropdownMenu menuButton={menuButton} buttonClassName={compact ? 'h-8 px-2 text-sm' : undefined}>
          <DropdownMenuItem href={`/address/${account}`} router retainSearchParams={['chainId']}>
            {t('common.buttons.my_allowances')}
          </DropdownMenuItem>
          <DropdownMenuItem href="/account" router>
            {t('common.buttons.my_account')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDisconnect}>{t('common.buttons.disconnect')}</DropdownMenuItem>
        </DropdownMenu>
      ) : (
        <ConnectButton size={size} style={style} className={className} text={connectText} redirect={isLandingPage} />
      )}
    </div>
  );
};

export default WalletIndicatorDropdown;
