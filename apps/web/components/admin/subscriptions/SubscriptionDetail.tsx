'use client';

import ActivityTable from 'components/admin/activity/ActivityTable';
import PermissionsCard from 'components/admin/common/PermissionsCard';
import RulesCard from 'components/admin/common/RulesCard';
import Card from 'components/common/Card';
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
  const {
    data: permissions,
    isLoading: isLoadingPermissions,
    error: permissionsError,
  } = useAdminSubscriptionPermissions(subscriptionId);
  const { data: rules, isLoading: isLoadingRules, error: rulesError } = useAdminSubscriptionRules(subscriptionId);

  if (isLoading || error || !subscription) {
    return <Card isLoading={isLoading} error={error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <SubscriptionSummaryCard subscription={subscription} />
      <SubscriptionProfitabilityCard subscription={subscription} />
      <CoveredAddressesCard addresses={subscription.addresses} />
      <SubscriptionPaymentsCard payments={subscription.payments} />
      <SubscriptionBudgetCard subscriptionId={subscriptionId} />
      <PermissionsCard permissions={permissions} isLoading={isLoadingPermissions} error={permissionsError} />
      <RulesCard rules={rules} isLoading={isLoadingRules} error={rulesError} />
      <ActivityTable
        scope={{ subscriptionId }}
        title="Activity"
        subtitle="All auto-revoke actions for the covered addresses, every status"
      />
    </div>
  );
};

export default SubscriptionDetail;
