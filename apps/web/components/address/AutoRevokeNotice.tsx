'use client';

import AutoRevokeSetupBanner from 'components/account/auto-revoke/AutoRevokeSetupBanner';
import { useAutoRevokeSetupNeeded, useAutoRevokeUpgradeNeeded } from 'lib/hooks/auto-revoke/useAutoRevokeSetupNeeded';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useMounted } from 'lib/hooks/useMounted';
import useLocalStorage from 'use-local-storage';
import { type Address, isAddressEqual } from 'viem';
import AutoRevokeUpgradeBanner from './AutoRevokeUpgradeBanner';

// Surfaces incomplete Auto-Revoking setup on the user's own dashboard, so they do not need to visit the account page to
// find out that Auto-Revoking is not protecting them. A misconfigured wallet takes priority over a wallet without setup.
const AutoRevokeNotice = () => {
  const isMounted = useMounted();
  const { address, isUltimate } = useAddress();
  const { account, upgradeNeededChainIds } = useAutoRevokeUpgradeNeeded();
  const { setupNeeded } = useAutoRevokeSetupNeeded();
  const [setupDismissedAddresses, setSetupDismissedAddresses] = useLocalStorage<Address[]>(
    'auto-revoke-setup-notice-dismissed',
    [],
  );

  if (!isMounted || !account || !isAddressEqual(address, account) || !isUltimate) return null;

  if (upgradeNeededChainIds.length > 0) {
    return <AutoRevokeUpgradeBanner account={account} chainIds={upgradeNeededChainIds} />;
  }

  const isSetupDismissed = setupDismissedAddresses.some((dismissedAddress) =>
    isAddressEqual(dismissedAddress, account),
  );
  if (!setupNeeded || isSetupDismissed) return null;

  return (
    <AutoRevokeSetupBanner
      account={account}
      location="dashboard"
      onDismiss={() => setSetupDismissedAddresses([...setupDismissedAddresses, account])}
    />
  );
};

export default AutoRevokeNotice;
