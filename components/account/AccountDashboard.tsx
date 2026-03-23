'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { useSiweSignIn } from 'lib/hooks/ethereum/siwe/useSiweSignIn';
import { usePremiumSubscriptions } from 'lib/hooks/premium/usePremiumSubscriptions';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import { useConnection } from 'wagmi';
import BillingSection from './BillingSection';
import CoverageSection from './coverage/CoverageSection';
import GrantedEntitlementsSection from './GrantedEntitlementsSection';
import PremiumAddressesSection from './PremiumAddressesSection';
import PremiumSubscriptionSection from './PremiumSubscriptionSection';
import UnauthenticatedView from './UnauthenticatedView';

const AccountDashboard = () => {
  const t = useTranslations();
  const { address: account } = useConnection();
  const { siweAddress } = useAuthSession();
  const { signIn, isLoading: isAuthenticating } = useSiweSignIn();

  const isAuthenticated = Boolean(account && siweAddress && siweAddress === account);

  const {
    subscriptions,
    entitlements,
    isLoading: isLoadingSubscriptions,
    isError,
  } = usePremiumSubscriptions((account as Address) ?? '0x', isAuthenticated);

  if (!isAuthenticated) {
    return <UnauthenticatedView account={account} signIn={signIn} isAuthenticating={isAuthenticating} />;
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-semibold leading-tight">{t('common.buttons.my_account')}</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t('account.description')}</p>
        </div>
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-yellow-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.error')}</p>
        </div>
      </div>
    );
  }

  const activeSubscription = subscriptions.find((sub) => sub.isActive);

  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold leading-tight">{t('common.buttons.my_account')}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t('account.description')}</p>
      </div>

      <PremiumSubscriptionSection account={account as Address} activeSubscription={activeSubscription} />
      {activeSubscription && (
        <PremiumAddressesSection activeSubscription={activeSubscription} account={account as Address} />
      )}
      {entitlements.length > 0 && <GrantedEntitlementsSection entitlements={entitlements} />}
      <BillingSection subscriptions={subscriptions} isLoading={isLoadingSubscriptions} />
      <CoverageSection account={account as Address} />
    </div>
  );
};

export default AccountDashboard;
