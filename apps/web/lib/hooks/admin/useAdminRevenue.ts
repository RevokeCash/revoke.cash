'use client';

import type { RegionSummary, RevenueData } from '@revoke.cash/core/admin/revenue';
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
  });
};

export const useAdminVatReport = (from: string, to: string) => {
  return useAdminQuery<AdminVatReport>(['admin', 'revenue', 'vat', from, to], '/api/admin/revenue/vat', {
    searchParams: { from, to },
    enabled: Boolean(from && to),
  });
};
