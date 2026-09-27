'use client';

import type { GasSpendReport } from '@revoke.cash/core/admin/gas-spend';
import { AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD } from '@revoke.cash/core/auto-revoke/config';
import DateRangePicker, { currentUtcDate, currentUtcMonthStart } from 'components/admin/common/DateRangePicker';
import StatTile from 'components/admin/common/StatTile';
import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import { formatPercentage, formatUsd } from 'lib/admin/format';
import { useAdminGasBudgets, useAdminGasSpend } from 'lib/hooks/admin/useAdminGas';
import { twMerge } from 'tailwind-merge';

interface Props {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

const GasOverviewSection = ({ from, to, onFromChange, onToChange }: Props) => {
  const { data: periodSpend, isLoading: isPeriodSpendLoading } = useAdminGasSpend(from, to);
  const { data: monthSpend, isLoading: isMonthSpendLoading } = useAdminGasSpend(
    currentUtcMonthStart(),
    currentUtcDate(),
  );
  const { data: budgets, isLoading: isBudgetsLoading } = useAdminGasBudgets(from, to);
  const isLoading = isPeriodSpendLoading || isMonthSpendLoading || isBudgetsLoading;

  const statementUrl = `/api/admin/gas/wallets?${new URLSearchParams({ from, to, format: 'pdf' })}`;

  return (
    <Card
      header={
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl">Gas</h2>
              <p>Auto-revoke executor gas spend, budgets and wallet flows in the selected period</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateRangePicker from={from} to={to} onFromChange={onFromChange} onToChange={onToChange} />
              <Button style="secondary" size="sm" href={statementUrl}>
                Gas statement PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      }
      isLoading={isLoading}
      className={twMerge(isLoading && 'h-40')}
    >
      {periodSpend && monthSpend && budgets && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Gas spend"
            value={formatUsd(periodSpend.spendUsd)}
            detail={`${periodSpend.actionCount} transactions`}
            secondary={{
              label: CURRENT_MONTH_LABEL,
              value: formatUsd(monthSpend.spendUsd),
              detail: `${monthSpend.actionCount} transactions`,
            }}
          />
          <StatTile
            label="Average per day"
            value={formatUsd(periodSpend.averageSpendPerDayUsd)}
            detail={`Over ${periodSpend.dayCount.toFixed(1)} days`}
            secondary={{
              label: CURRENT_MONTH_LABEL,
              value: formatUsd(monthSpend.averageSpendPerDayUsd),
              detail: `Over ${monthSpend.dayCount.toFixed(1)} days`,
            }}
          />
          <StatTile
            label="Average monthly budget use"
            value={formatOptionalUsd(budgets.averageMonthlyUsageUsd)}
            detail={
              budgets.averageMonthlyUsageUsd === null
                ? 'No gas use in this period'
                : `${formatBudgetShare(budgets.averageMonthlyUsageUsd)} of budget, ${budgets.averagedSubscriptionCount} subscriptions`
            }
            secondary={{
              label: CURRENT_MONTH_LABEL,
              value: formatOptionalUsd(budgets.currentMonthAverageUsageUsd),
              detail:
                budgets.currentMonthAverageUsageUsd === null
                  ? 'No gas use yet'
                  : `${formatBudgetShare(budgets.currentMonthAverageUsageUsd)} of budget, ${budgets.reachedBudgetCount} of ${budgets.currentMonthAveragedSubscriptionCount} at budget`,
            }}
          />
          <StatTile
            label="Failed transactions"
            value={formatUsd(periodSpend.failedSpendUsd)}
            detail={formatFailedDetail(periodSpend)}
            secondary={{
              label: CURRENT_MONTH_LABEL,
              value: formatUsd(monthSpend.failedSpendUsd),
              detail: formatFailedDetail(monthSpend),
            }}
          />
        </div>
      )}
    </Card>
  );
};

const CURRENT_MONTH_LABEL = 'This month';

const formatOptionalUsd = (amountUsd: number | null): string => (amountUsd === null ? '-' : formatUsd(amountUsd));

const formatBudgetShare = (usageUsd: number): string => formatPercentage(usageUsd / AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD);

const formatFailedDetail = (spend: GasSpendReport): string => {
  const spendShare = spend.spendUsd > 0 ? formatPercentage(spend.failedSpendUsd / spend.spendUsd) : '0%';
  return `${spendShare} of spend, ${spend.failedActionCount} transactions`;
};

export default GasOverviewSection;
