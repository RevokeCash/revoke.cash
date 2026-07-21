'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { AddressSubscription } from '@revoke.cash/core/admin/lookup';
import GrantSubscriptionButton from 'components/admin/subscriptions/GrantSubscriptionButton';
import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import CopyButton from 'components/common/CopyButton';
import EmptyState from 'components/common/EmptyState';
import StatusLabel from 'components/common/StatusLabel';
import TimeAgo from 'components/common/TimeAgo';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { twMerge } from 'tailwind-merge';
import type { Address } from 'viem';

interface Props {
  address: Address;
  subscriptions?: AddressSubscription[];
  isLoading: boolean;
}

// The grant button targets subscriptions owned by this address, so its extension preview only
// considers the owned subscription, not subscriptions that merely cover the address
const AddressSubscriptionsCard = ({ address, subscriptions, isLoading }: Props) => {
  const ownedSubscription = subscriptions?.find(
    (subscription) => subscription.ownerAddress.toLowerCase() === address.toLowerCase(),
  );

  return (
    <Card
      header={
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl">Subscriptions</h2>
              <p>Active subscriptions that include this address</p>
            </div>
            <GrantSubscriptionButton ownerAddress={address} currentEndsAt={ownedSubscription?.endsAt} />
          </div>
        </CardHeader>
      }
      isLoading={isLoading}
      className={twMerge('p-0', isLoading && 'h-80')}
    >
      {subscriptions && subscriptions.length === 0 && (
        <EmptyState icon={ExclamationTriangleIcon} iconClassName="text-red-500 dark:text-red-400">
          No active subscription includes this address, so auto-revoke will not run for it.
        </EmptyState>
      )}
      {subscriptions && subscriptions.length > 0 && (
        <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.subscriptionId}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{subscription.planName}</span>
                <StatusLabel status={subscription.tier === 'ultimate' ? 'info' : 'neutral'} className="py-0.75">
                  {subscription.tier}
                </StatusLabel>
                <div className="flex items-center gap-2 font-mono text-sm">
                  {subscription.ownerAddress}
                  <CopyButton content={subscription.ownerAddress} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  ends{' '}
                  <WithHoverTooltip tooltip={subscription.endsAt}>
                    <span>
                      <TimeAgo datetime={new Date(subscription.endsAt)} />
                    </span>
                  </WithHoverTooltip>
                </span>
              </div>
              <Button style="secondary" size="sm" href={`/admin/subscriptions/${subscription.subscriptionId}`} router>
                View subscription
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default AddressSubscriptionsCard;
