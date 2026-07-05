import { isUltimatePlan } from '@revoke.cash/core/premium/plans';
import { isSubscriptionActive } from '@revoke.cash/core/premium/subscriptions';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { usePremiumSubscriptions } from 'lib/hooks/premium/usePremiumSubscriptions';
import { useConnection } from 'wagmi';

// The composed data source for the account tabs: the SIWE-authenticated account, its subscription
// data, and the derived selections the tabs need. The underlying query is deduplicated by TanStack
// Query, so every tab can call this hook without refetching.
export const useAccountSubscriptions = () => {
  const { address: account } = useConnection();
  const { siweAddress } = useAuthSession();
  const isAuthenticated = Boolean(account && siweAddress && siweAddress === account);

  const { subscriptions, entitlements, isLoading, isError } = usePremiumSubscriptions(account!, isAuthenticated);

  const activeSubscription = subscriptions.find((subscription) => isSubscriptionActive(subscription));
  const activeUltimateSubscription = subscriptions.find(
    (subscription) => isSubscriptionActive(subscription) && isUltimatePlan(subscription.plan),
  );
  const ultimateEntitlement = entitlements
    .filter((entitlement) => isUltimatePlan(entitlement))
    .sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime())[0];

  return {
    account,
    isAuthenticated,
    subscriptions,
    entitlements,
    isLoading,
    isError,
    activeSubscription,
    activeUltimateSubscription,
    ultimateEntitlement,
  };
};
