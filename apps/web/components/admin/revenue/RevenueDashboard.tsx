'use client';

import { type DateRange, getPeriod, getToday } from 'lib/admin/date-range';
import { useState } from 'react';
import BatchRevokeSplitSection from './BatchRevokeSplitSection';
import FeeReconciliationSection from './FeeReconciliationSection';
import PaymentFunnelSection from './PaymentFunnelSection';
import RevenueBreakdownSection from './RevenueBreakdownSection';
import RevenueChart from './RevenueChart';
import VatSection from './VatSection';

// One date range drives every section, so the chart, tables and VAT summary always cover the same period
const RevenueDashboard = () => {
  const [range, setRange] = useState<DateRange>(() => getPeriod('year', getToday()));

  return (
    <div className="flex flex-col gap-6">
      <RevenueChart range={range} onRangeChange={setRange} />
      <RevenueBreakdownSection range={range} />
      <PaymentFunnelSection range={range} />
      <BatchRevokeSplitSection range={range} />
      <FeeReconciliationSection range={range} />
      <VatSection range={range} />
    </div>
  );
};

export default RevenueDashboard;
