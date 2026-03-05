'use client';

import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { useSiweSignIn } from 'lib/hooks/ethereum/siwe/useSiweSignIn';
import { usePremiumSubscriptions } from 'lib/hooks/premium/usePremiumSubscriptions';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import { useConnection } from 'wagmi';
import BillingSection from './BillingSection';
import ConnectedWalletSection from './ConnectedWalletSection';
import PremiumAddressesSection from './PremiumAddressesSection';
import PremiumSubscriptionSection from './PremiumSubscriptionSection';
import UnauthenticatedView from './UnauthenticatedView';

const AccountDashboard = () => {
  const t = useTranslations();
  const { address: account, chainId } = useConnection();
  const { siweAddress } = useAuthSession();
  const { signIn, isLoading: isAuthenticating } = useSiweSignIn();

  const isAuthenticated = Boolean(account && siweAddress && siweAddress === account);

  const { subscriptions, isLoading: isLoadingSubscriptions } = usePremiumSubscriptions(
    (account as Address) ?? '0x',
    isAuthenticated,
  );

  if (!isAuthenticated) {
    return <UnauthenticatedView account={account} signIn={signIn} isAuthenticating={isAuthenticating} />;
  }

  const activeSubscription = subscriptions.find((sub) => sub.isActive);

  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold leading-tight">{t('common.buttons.my_account')}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Manage your premium subscription and address slots.</p>
      </div>

      <ConnectedWalletSection account={account as Address} chainId={chainId} />
      <PremiumSubscriptionSection account={account as Address} activeSubscription={activeSubscription} />
      {activeSubscription && (
        <PremiumAddressesSection activeSubscription={activeSubscription} account={account as Address} />
      )}
      <BillingSection subscriptions={subscriptions} isLoading={isLoadingSubscriptions} />
    </div>
  );
};

export default AccountDashboard;
