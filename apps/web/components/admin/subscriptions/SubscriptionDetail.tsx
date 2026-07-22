'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ActivityTable from 'components/admin/activity/ActivityTable';
import PermissionsCard from 'components/admin/common/PermissionsCard';
import RulesCard from 'components/admin/common/RulesCard';
import Card from 'components/common/Card';
import EmptyState from 'components/common/EmptyState';
import ErrorDisplay from 'components/common/ErrorDisplay';
import {
  useAdminSubscription,
  useAdminSubscriptionPermissions,
  useAdminSubscriptionRules,
} from 'lib/hooks/admin/useAdminSubscriptions';
import CoveredAddressesCard from './CoveredAddressesCard';
import SubscriptionPaymentsCard from './payments/SubscriptionPaymentsCard';
import SubscriptionBudgetCard from './SubscriptionBudgetCard';
import SubscriptionProfitabilityCard from './SubscriptionProfitabilityCard';
import SubscriptionSummaryCard from './SubscriptionSummaryCard';

interface Props {
  subscriptionId: string;
}

const SubscriptionDetail = ({ subscriptionId }: Props) => {
  const { data: subscription, isLoading, error } = useAdminSubscription(subscriptionId);
  const { data: permissions, isLoading: isLoadingPermissions } = useAdminSubscriptionPermissions(subscriptionId);
  const { data: rules, isLoading: isLoadingRules } = useAdminSubscriptionRules(subscriptionId);

  if (isLoading || error || !subscription) {
    return (
      <Card isLoading={isLoading}>
        {error && (
          <EmptyState icon={ExclamationTriangleIcon} iconClassName="text-red-500 dark:text-red-400">
            <ErrorDisplay error={error} withIcon={false} />
          </EmptyState>
        )}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SubscriptionSummaryCard subscription={subscription} />
      <SubscriptionProfitabilityCard subscription={subscription} />
      <CoveredAddressesCard addresses={subscription.addresses} />
      <SubscriptionPaymentsCard payments={subscription.payments} />
      <SubscriptionBudgetCard subscriptionId={subscriptionId} />
      <PermissionsCard permissions={permissions} isLoading={isLoadingPermissions} />
      <RulesCard rules={rules} isLoading={isLoadingRules} />
      <ActivityTable
        scope={{ subscriptionId }}
        title="Activity"
        subtitle="All auto-revoke actions for the covered addresses, every status"
      />
    </div>
  );
};

export default SubscriptionDetail;
