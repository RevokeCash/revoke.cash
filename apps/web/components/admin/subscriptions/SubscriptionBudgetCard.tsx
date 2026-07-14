'use client';

import AutoRevokeBudgetSummary from 'components/account/auto-revoke/activity/AutoRevokeBudgetSummary';
import Card, { CardTitle } from 'components/common/Card';
import { useAdminSubscriptionBudget } from 'lib/hooks/admin/useAdminSubscriptions';
import { twMerge } from 'tailwind-merge';

interface Props {
  subscriptionId: string;
}

const SubscriptionBudgetCard = ({ subscriptionId }: Props) => {
  const { data: budget, isLoading } = useAdminSubscriptionBudget(subscriptionId);

  return (
    <Card
      header={<CardTitle title="Gas budget" subtitle="Auto-revoke gas spend for the current UTC month" />}
      isLoading={isLoading}
      className={twMerge(isLoading && 'h-40')}
    >
      {budget && <AutoRevokeBudgetSummary budget={budget} />}
    </Card>
  );
};

export default SubscriptionBudgetCard;
