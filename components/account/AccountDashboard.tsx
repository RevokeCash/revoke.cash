'use client';

import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { useSiweSignIn } from 'lib/hooks/ethereum/siwe/useSiweSignIn';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import { useConnection } from 'wagmi';
import ConnectedWalletSection from './ConnectedWalletSection';
import PremiumPurchaseSection from './PremiumPurchaseSection';
import SubscriptionsSection from './SubscriptionsSection';
import UnauthenticatedView from './UnauthenticatedView';

const AccountDashboard = () => {
  const t = useTranslations();
  const { address: account, chainId } = useConnection();
  const { siweAddress } = useAuthSession();
  const { signIn, isLoading: isAuthenticating } = useSiweSignIn();

  const isAuthenticated = Boolean(account && siweAddress && siweAddress === account);

  if (!isAuthenticated) {
    return <UnauthenticatedView account={account} signIn={signIn} isAuthenticating={isAuthenticating} />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold leading-tight">{t('common.buttons.my_account')}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage your premium subscription, billing payment intents, and address slots.
        </p>
      </div>

      <ConnectedWalletSection account={account as Address} chainId={chainId} />
      <PremiumPurchaseSection account={account as Address} />
      <SubscriptionsSection account={account as Address} />
    </div>
  );
};

export default AccountDashboard;
