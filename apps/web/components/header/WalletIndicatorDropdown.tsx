'use client';

import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import { useQueryClient } from '@tanstack/react-query';
import DropdownMenu, { DropdownMenuItem } from 'components/common/DropdownMenu';
import { AUTH_SESSION_QUERY_KEY, ENSURE_API_SESSION_QUERY_KEY } from 'lib/auth/session';
import { useAutoRevokeUpgradeNeeded } from 'lib/hooks/auto-revoke/useAutoRevokeSetupNeeded';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { useMounted } from 'lib/hooks/useMounted';
import ky from 'lib/ky';
import { trackAutoRevokeNoticeAction } from 'lib/utils/auto-revoke-notice';
import { isLedgerLive } from 'lib/utils/wallet';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
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
  const { address: account, connector } = useConnection();
  const { domainName } = useNameLookup(account);
  const { mutate: disconnect } = useDisconnect();
  const { account: autoRevokeAccount, upgradeNeededChainIds } = useAutoRevokeUpgradeNeeded();
  const isAutoRevokeUpgradeNeeded = Boolean(account && autoRevokeAccount && upgradeNeededChainIds.length > 0);
  const upgradeDotRef = useRef<HTMLSpanElement>(null);

  // The header renders a desktop and a mobile copy of this dropdown and hides one with CSS, so only the visible dot
  // counts as a view (an element inside a hidden parent has no offsetParent)
  // biome-ignore lint/correctness/useExhaustiveDependencies: A view is tracked once each time the dot appears
  useEffect(() => {
    if (!isAutoRevokeUpgradeNeeded || !upgradeDotRef.current?.offsetParent) return;
    trackAutoRevokeNoticeAction({
      action: 'view',
      notice: 'upgrade_needed',
      location: 'header',
      account: autoRevokeAccount!,
    });
  }, [isAutoRevokeUpgradeNeeded, isMounted]);

  const isLandingPage = pathname === '/' || /^\/[a-z]{2}$/.test(pathname);

  // The Safe App and Ledger Live connect the wallet automatically, so they would undo a disconnect right away
  const canDisconnect = connector?.id !== 'safe' && !isLedgerLive();

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
    <div className="relative flex whitespace-nowrap">
      {account ? (
        <DropdownMenu menuButton={menuButton} buttonClassName={compact ? 'h-8 px-2 text-sm' : undefined}>
          {isAutoRevokeUpgradeNeeded && (
            <DropdownMenuItem
              href="/account/auto-revoke"
              router
              className="gap-2"
              onClick={() =>
                trackAutoRevokeNoticeAction({
                  action: 'click',
                  notice: 'upgrade_needed',
                  location: 'header',
                  account: autoRevokeAccount!,
                })
              }
            >
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
              {t('common.buttons.fix_auto_revoke')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem href={`/address/${account}`} router retainSearchParams={['chainId']}>
            {t('common.buttons.my_allowances')}
          </DropdownMenuItem>
          <DropdownMenuItem href="/account" router>
            {t('common.buttons.my_account')}
          </DropdownMenuItem>
          {canDisconnect && (
            <DropdownMenuItem onClick={handleDisconnect}>{t('common.buttons.disconnect')}</DropdownMenuItem>
          )}
        </DropdownMenu>
      ) : (
        <ConnectButton size={size} style={style} className={className} text={connectText} redirect={isLandingPage} />
      )}
      {isAutoRevokeUpgradeNeeded && (
        <span
          ref={upgradeDotRef}
          className="pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-yellow-500 ring-2 ring-white dark:ring-black"
        />
      )}
    </div>
  );
};

export default WalletIndicatorDropdown;
