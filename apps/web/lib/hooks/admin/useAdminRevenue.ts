'use client';

import type { RegionSummary, RevenueData } from '@revoke.cash/core/admin/revenue';
import { keepPreviousData } from '@tanstack/react-query';
import { countMonths, getToday } from 'lib/admin/date-range';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';

export interface VatStream {
  recordCount: number;
  summary: RegionSummary[];
}

interface AdminVatReport {
  premium: VatStream;
  batchRevokes: VatStream;
}

export const useAdminRevenueData = (months: number = 12) => {
  return useAdminQuery<RevenueData>(['admin', 'revenue', 'data', months], '/api/admin/revenue/data', {
    searchParams: { months },
    placeholderData: keepPreviousData,
  });
};

// The data endpoint returns whole UTC months up to now. At least 12 months are loaded, so every range in the last
// year shares one cached fetch (also with the overview tab).
export const useAdminRevenueDataSince = (fromDate: string) => {
  return useAdminRevenueData(Math.max(12, countMonths({ from: fromDate, to: getToday() })));
};

export const useAdminVatReport = (from: string, to: string) => {
  return useAdminQuery<AdminVatReport>(['admin', 'revenue', 'vat', from, to], '/api/admin/revenue/vat', {
    searchParams: { from, to },
    enabled: Boolean(from && to),
    placeholderData: keepPreviousData,
  });
};
