'use client';

import type { AdminSubscriptionDetail } from '@revoke.cash/core/admin/subscriptions';
import { formatDate, formatDateNormalised } from '@revoke.cash/core/utils/time';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import { useRebuildSubscription } from 'lib/hooks/admin/useAdminSubscriptions';
import SubscriptionPlanLabel from './SubscriptionPlanLabel';
import SubscriptionStatusBadge from './SubscriptionStatusBadge';

interface Props {
  subscription: AdminSubscriptionDetail;
}

const SubscriptionSummaryCard = ({ subscription }: Props) => {
  const rebuildMutation = useRebuildSubscription(subscription.id);

  const handleRebuild = () => {
    const confirmed = window.confirm(
      'Rebuild this subscription period from its confirmed payments? This overwrites the current period.',
    );
    if (!confirmed) return;
    rebuildMutation.mutate();
  };

  return (
    <Card
      header={
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl">Subscription</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">{subscription.id}</p>
            </div>
            <Button style="secondary" size="sm" onClick={handleRebuild} loading={rebuildMutation.isPending}>
              Rebuild from payments
            </Button>
          </div>
        </CardHeader>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryField label="Owner">
          <AdminAddressLink address={subscription.ownerAddress} />
        </SummaryField>
        <SummaryField label="Plan">
          <SubscriptionPlanLabel planName={subscription.plan.name} tier={subscription.plan.tier} />
        </SummaryField>
        <SummaryField label="Status">
          <SubscriptionStatusBadge isActive={subscription.isActive} />
        </SummaryField>
        <SummaryField label="Period">
          <span>
            {formatDate(subscription.startsAt)} - {formatDate(subscription.endsAt)}
          </span>
        </SummaryField>
        <SummaryField label="Created">
          <span>{formatDateNormalised(new Date(subscription.createdAt))}</span>
        </SummaryField>
        <SummaryField label="Address slots">
          <span>
            {subscription.addresses.length} / {subscription.plan.maxAddresses} used
          </span>
        </SummaryField>
      </div>
    </Card>
  );
};

interface SummaryFieldProps {
  label: string;
  children: React.ReactNode;
}

const SummaryField = ({ label, children }: SummaryFieldProps) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
    {children}
  </div>
);

export default SubscriptionSummaryCard;
