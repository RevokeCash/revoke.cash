'use client';

import ExecutorBalancesSection from 'components/admin/overview/ExecutorBalancesSection';
import { type DateRange, getPeriod, getToday } from 'lib/admin/date-range';
import { useState } from 'react';
import FailedTransactionsSection from './FailedTransactionsSection';
import GasDepositsSection from './GasDepositsSection';
import GasOverviewSection from './GasOverviewSection';
import GasSpendSection from './GasSpendSection';
import SubscriptionBudgetsSection from './SubscriptionBudgetsSection';
import WalletBalancesSection from './WalletBalancesSection';

// One date range drives every period-based section, so all numbers match the downloadable gas statement
const GasDashboard = () => {
  const [range, setRange] = useState<DateRange>(() => getPeriod('year', getToday()));

  return (
    <div className="flex flex-col gap-6">
      <GasOverviewSection range={range} onRangeChange={setRange} />
      <ExecutorBalancesSection showFundButtons />
      <GasSpendSection from={range.from} to={range.to} />
      <FailedTransactionsSection from={range.from} to={range.to} />
      <SubscriptionBudgetsSection from={range.from} to={range.to} />
      <WalletBalancesSection from={range.from} to={range.to} />
      <GasDepositsSection from={range.from} to={range.to} />
    </div>
  );
};

export default GasDashboard;
