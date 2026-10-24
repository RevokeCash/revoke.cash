import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import { useAddressAutoRevokePermissions } from './useAutoRevokePermissions';
import { useAutoRevokeSupport } from './useAutoRevokeSupport';

// The shared "subscribed but not protected" signal: the connected wallet is covered by an Ultimate
// subscription or entitlement, but has not granted any auto-revoke permissions yet, meaning
// auto-revoking is not doing anything for it. Used to nudge users towards completing setup.
export const useAutoRevokeSetupNeeded = () => {
  const { account, activePermissions, isLoaded } = useUltimateWalletPermissions();

  // Nudging a wallet that cannot grant permissions towards a setup it can never complete is worse
  // than staying quiet: the auto-revoke tab explains why the feature is unavailable instead.
  const { supportsAutoRevoke } = useAutoRevokeSupport();

  return { account, setupNeeded: isLoaded && supportsAutoRevoke && activePermissions.length === 0 };
};

// The shared "subscribed but misconfigured" signal: the connected wallet granted permissions, but on these chains it
// is not a MetaMask smart account, so every auto-revoke there fails. Unlike the setup signal, this does not depend on
// the connected wallet's support, because the granted permissions keep failing whichever wallet is connected now.
export const useAutoRevokeUpgradeNeeded = () => {
  const { account, activePermissions, isLoaded } = useUltimateWalletPermissions();

  const upgradeNeededChainIds = isLoaded
    ? activePermissions.filter((permission) => !permission.accountUpgraded).map((permission) => permission.chainId)
    : [];

  return { account, upgradeNeededChainIds };
};

const useUltimateWalletPermissions = () => {
  const { account, isAuthenticated, activeUltimateSubscription, ultimateEntitlement } = useAccountSubscriptions();
  const hasUltimate = Boolean(activeUltimateSubscription || ultimateEntitlement);
  const isEnabled = isAuthenticated && hasUltimate;

  const { permissions, isLoading, isError } = useAddressAutoRevokePermissions(account!, isEnabled);
  const activePermissions = permissions.filter((permission) => permission.isActive);

  return { account, activePermissions, isLoaded: isEnabled && !isLoading && !isError };
};
