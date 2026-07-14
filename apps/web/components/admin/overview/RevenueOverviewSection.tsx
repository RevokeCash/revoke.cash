'use client';

import { deriveTotals, utcMonthStartIso } from '@revoke.cash/core/admin/revenue';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import Card, { CardTitle } from 'components/common/Card';
import { useAdminRevenueOverview } from 'lib/hooks/admin/useAdminOverview';
import { useAdminRevenueData } from 'lib/hooks/admin/useAdminRevenue';
import { twMerge } from 'tailwind-merge';

const RevenueOverviewSection = () => {
  // months=12 matches the revenue page so both share the same cached fetch
  const { data: revenueData, isLoading: isRevenueDataLoading } = useAdminRevenueData(12);
  const { data: runRateData, isLoading: isRunRateLoading } = useAdminRevenueOverview();
  const isLoading = isRevenueDataLoading || isRunRateLoading;

  const currentMonth = revenueData && deriveTotals(revenueData, utcMonthStartIso(), new Date().toISOString());
  const previousMonth = revenueData && deriveTotals(revenueData, utcMonthStartIso(1), utcMonthStartIso());

  return (
    <Card
      header={<CardTitle title="Revenue" subtitle="Confirmed subscription payments and recorded batch revoke fees" />}
      isLoading={isLoading}
      className={twMerge(isLoading && 'h-40')}
    >
      {currentMonth && previousMonth && runRateData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <RevenueTile
            label="This month"
            valueUsdCents={currentMonth.subscriptionsUsdCents + currentMonth.batchRevokesUsdCents}
            detail={`${formatUsdCents(currentMonth.subscriptionsUsdCents)} subscriptions / ${formatUsdCents(currentMonth.batchRevokesUsdCents)} batch revokes`}
          />
          <RevenueTile
            label="Last month"
            valueUsdCents={previousMonth.subscriptionsUsdCents + previousMonth.batchRevokesUsdCents}
            detail={`${formatUsdCents(previousMonth.subscriptionsUsdCents)} subscriptions / ${formatUsdCents(previousMonth.batchRevokesUsdCents)} batch revokes`}
          />
          <RevenueTile
            label="Annual run rate"
            valueUsdCents={runRateData.runRate.totalUsdCents}
            detail={`${formatUsdCents(runRateData.runRate.byTier.premium)} Premium / ${formatUsdCents(runRateData.runRate.byTier.ultimate)} Ultimate`}
          />
        </div>
      )}
    </Card>
  );
};

interface RevenueTileProps {
  label: string;
  valueUsdCents: number;
  detail: string;
}

const RevenueTile = ({ label, valueUsdCents, detail }: RevenueTileProps) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
    <span className="text-2xl font-semibold">{formatUsdCents(valueUsdCents)}</span>
    <span className="text-xs text-zinc-500 dark:text-zinc-500">{detail}</span>
  </div>
);

export default RevenueOverviewSection;
