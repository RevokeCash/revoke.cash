'use client';

import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import AutoRevokeSection from '../auto-revoke/AutoRevokeSection';
import AutoRevokeUpsell from '../auto-revoke/AutoRevokeUpsell';
import AutoRevokeActivitySection from '../auto-revoke/activity/AutoRevokeActivitySection';

const AutoRevokeTab = () => {
  const { account, activeUltimateSubscription, ultimateEntitlement } = useAccountSubscriptions();

  const hasUltimate = Boolean(activeUltimateSubscription || ultimateEntitlement);

  return (
    <div className="w-full flex flex-col gap-4">
      {hasUltimate ? (
        <>
          <AutoRevokeSection activeSubscription={activeUltimateSubscription} account={account!} />
          <AutoRevokeActivitySection subscriptionId={activeUltimateSubscription?.id} />
        </>
      ) : (
        <AutoRevokeUpsell />
      )}
    </div>
  );
};

export default AutoRevokeTab;
