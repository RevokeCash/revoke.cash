'use client';

import { usePremiumSubscriptions } from 'lib/hooks/premium/usePremiumSubscriptions';
import { useSubscriptionAddresses } from 'lib/hooks/premium/useSubscriptionAddresses';
import type { Address } from 'viem';
import SubscriptionCard from './SubscriptionCard';

interface Props {
  account: Address;
}

const SubscriptionsSection = ({ account }: Props) => {
  const { subscriptions, isLoading } = usePremiumSubscriptions(account, true);
  const addresses = useSubscriptionAddresses(account);

  return (
    <section className="rounded-lg border border-black dark:border-white p-5 md:p-6 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Your subscriptions</h2>

      {isLoading && <p className="text-zinc-600 dark:text-zinc-400">Loading subscriptions...</p>}

      {!isLoading && subscriptions.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">No premium subscriptions found for this wallet yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {subscriptions.map((subscription) => (
          <SubscriptionCard key={subscription.id} subscription={subscription} addresses={addresses} />
        ))}
      </div>
    </section>
  );
};

export default SubscriptionsSection;
