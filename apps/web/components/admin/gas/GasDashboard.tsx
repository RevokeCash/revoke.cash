'use client';

import { currentUtcDate, currentUtcYearStart } from 'components/admin/common/DateRangePicker';
import ExecutorBalancesSection from 'components/admin/overview/ExecutorBalancesSection';
import { useState } from 'react';
import FailedTransactionsSection from './FailedTransactionsSection';
import GasDepositsSection from './GasDepositsSection';
import GasOverviewSection from './GasOverviewSection';
import GasSpendSection from './GasSpendSection';
import SubscriptionBudgetsSection from './SubscriptionBudgetsSection';
import WalletBalancesSection from './WalletBalancesSection';

// One date range drives every period-based section, so all numbers match the downloadable gas statement
const GasDashboard = () => {
  const [fromDate, setFromDate] = useState(currentUtcYearStart);
  const [toDate, setToDate] = useState(currentUtcDate);

  return (
    <div className="flex flex-col gap-6">
      <GasOverviewSection from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
      <ExecutorBalancesSection showFundButtons />
      <GasSpendSection from={fromDate} to={toDate} />
      <FailedTransactionsSection from={fromDate} to={toDate} />
      <SubscriptionBudgetsSection from={fromDate} to={toDate} />
      <WalletBalancesSection from={fromDate} to={toDate} />
      <GasDepositsSection from={fromDate} to={toDate} />
    </div>
  );
};

export default GasDashboard;
