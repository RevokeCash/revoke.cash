import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import { useAddressAutoRevokePermissions } from './useAutoRevokePermissions';

// The shared "subscribed but not protected" signal: the connected wallet is covered by an Ultimate
// subscription or entitlement, but has not granted any auto-revoke permissions yet, meaning
// auto-revoking is not doing anything for it. Used to nudge users towards completing setup.
export const useAutoRevokeSetupNeeded = () => {
  const { account, isAuthenticated, activeUltimateSubscription, ultimateEntitlement } = useAccountSubscriptions();
  const hasUltimate = Boolean(activeUltimateSubscription || ultimateEntitlement);

  const { permissions, isLoading, isError } = useAddressAutoRevokePermissions(account!, isAuthenticated && hasUltimate);
  const hasActivePermissions = permissions.some((permission) => permission.isActive);

  return { setupNeeded: hasUltimate && !isLoading && !isError && !hasActivePermissions };
};
