'use client';

import { formatVatRate, type RegionSummary } from '@revoke.cash/core/admin/revenue';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useAdminVatReport, type VatStream } from 'lib/hooks/admin/useAdminRevenue';
import { useTable } from 'lib/hooks/useTable';
import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import DateRangeInputs, { currentUtcDate, currentUtcYearStart } from './DateRangeInputs';

const VatSection = () => {
  const [fromDate, setFromDate] = useState(currentUtcYearStart);
  const [toDate, setToDate] = useState(currentUtcDate);
  const { data, isLoading } = useAdminVatReport(fromDate, toDate);

  const csvUrl = `/api/admin/revenue/vat?${new URLSearchParams({ from: fromDate, to: toDate, format: 'csv' })}`;

  return (
    <Card
      header={
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl">VAT summary</h2>
              <p>Gross revenue per VAT region; VAT extracted from gross amounts at the standard rate</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateRangeInputs from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
              <Button style="secondary" size="sm" href={csvUrl}>
                Download CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      }
      isLoading={isLoading}
      className={twMerge(isLoading && 'h-80')}
    >
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VatStreamTable
            title="Premium subscriptions"
            stream={data.premium}
            invoiceUrl={buildInvoiceUrl('premium', fromDate, toDate)}
          />
          <VatStreamTable
            title="Batch revoke fees"
            stream={data.batchRevokes}
            invoiceUrl={buildInvoiceUrl('batch_revokes', fromDate, toDate)}
          />
        </div>
      )}
    </Card>
  );
};

const buildInvoiceUrl = (stream: 'premium' | 'batch_revokes', from: string, to: string): string => {
  return `/api/admin/revenue/invoice?${new URLSearchParams({ stream, from, to })}`;
};

// The shared TableFooter renders directly below the header (it exists for the allowances select-all
// row), so the totals live in a synthetic last data row instead
const TOTALS_REGION_CODE = 'TOTAL';

const isTotalsRow = (row: RegionSummary): boolean => row.regionCode === TOTALS_REGION_CODE;

// Totals cover all regions, not just the visible ones (rows with revenue plus the ROW catch-all)
const buildVatRows = (stream: VatStream): RegionSummary[] => {
  const visibleRows = stream.summary.filter((row) => row.revenue > 0 || row.regionCode === 'ROW');

  const totalsRow: RegionSummary = {
    region: 'Total',
    regionCode: TOTALS_REGION_CODE,
    revenue: stream.summary.reduce((sum, row) => sum + row.revenue, 0),
    vatRate: 0,
    vatAmount: stream.summary.reduce((sum, row) => sum + row.vatAmount, 0),
  };

  return [...visibleRows, totalsRow];
};

const columnHelper = createColumnHelper<RegionSummary>();

const columns = [
  columnHelper.accessor('region', {
    id: 'region',
    header: 'Region',
    cell: (info) => (
      <div className={twMerge('py-1.5 pr-4 text-sm', isTotalsRow(info.row.original) && 'font-medium')}>
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor('revenue', {
    id: 'revenue',
    header: () => <div className="text-right">Revenue</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 pr-4 text-right text-sm', isTotalsRow(info.row.original) && 'font-medium')}>
        {formatUsdCents(info.getValue())}
      </div>
    ),
  }),
  columnHelper.accessor('vatRate', {
    id: 'vatRate',
    header: () => <div className="text-right">VAT rate</div>,
    cell: (info) => (
      <div className="py-1.5 pr-4 text-right text-sm">
        {isTotalsRow(info.row.original) ? null : formatVatRate(info.getValue())}
      </div>
    ),
  }),
  columnHelper.accessor('vatAmount', {
    id: 'vatAmount',
    header: () => <div className="text-right">VAT amount</div>,
    cell: (info) => (
      <div className={twMerge('py-1.5 text-right text-sm', isTotalsRow(info.row.original) && 'font-medium')}>
        {formatUsdCents(info.getValue())}
      </div>
    ),
  }),
];

interface VatStreamTableProps {
  title: string;
  stream: VatStream;
  invoiceUrl: string;
}

const VatStreamTable = ({ title, stream, invoiceUrl }: VatStreamTableProps) => {
  const rows = useMemo(() => buildVatRows(stream), [stream]);

  const table = useTable({
    data: rows,
    columns,
    getRowId: (row) => row.regionCode,
    // Large enough that the totals row always stays on the single page
    pageSize: 100,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">
          {title} <span className="text-sm text-zinc-500 font-normal">({stream.recordCount} records)</span>
        </h3>
        <Button style="secondary" size="sm" href={invoiceUrl}>
          Invoice PDF
        </Button>
      </div>
      <Table table={table} loading={false} className="border-none" />
    </div>
  );
};

export default VatSection;
