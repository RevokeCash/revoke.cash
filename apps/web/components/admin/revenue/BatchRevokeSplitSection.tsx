'use client';

import { deriveSponsorSplit } from '@revoke.cash/core/admin/revenue';
import { BATCH_REVOKE_FEE_USD_CENTS } from '@revoke.cash/core/constants';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { type DateRange, formatPeriodOrDays, getStartedPeriods, getToday, type Period } from 'lib/admin/date-range';
import { useAdminRevenueDataSince } from 'lib/hooks/admin/useAdminRevenue';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

const PAID_BUCKET = 'Paid';
const PREMIUM_BUCKET = 'Revoke Premium';

interface MonthRow {
  month: Period;
}

const columnHelper = createColumnHelper<AppTableFeatures, MonthRow>();

interface Props {
  range: DateRange;
}

const BatchRevokeSplitSection = ({ range }: Props) => {
  const { data, isLoading, isPlaceholderData } = useAdminRevenueDataSince(range.from);

  const splitPoints = useMemo(() => {
    if (!data) return [];
    return deriveSponsorSplit(data, getStartedPeriods(range, 'month', getToday()));
  }, [data, range]);

  // Split points come oldest month first, and only months with batch revokes have points
  const monthsNewestFirst = useMemo(
    () =>
      deduplicateArray(
        splitPoints.map((point) => point.bucket),
        (month) => month.from,
      )
        .reverse()
        .map((month) => ({ month })),
    [splitPoints],
  );

  // Sponsor buckets vary with the data, so the columns are derived from the fetched split points
  const columns = useMemo(() => {
    const otherSponsorNames = deduplicateArray(
      splitPoints
        .map((point) => point.sponsor)
        .filter((sponsor): sponsor is string => sponsor !== null && sponsor !== PREMIUM_BUCKET),
    ).sort();
    const bucketNames = [PAID_BUCKET, PREMIUM_BUCKET, ...otherSponsorNames];

    const pointsByMonthAndBucket = new Map(
      splitPoints.map((point) => [`${point.bucket.from}|${point.sponsor ?? PAID_BUCKET}`, point]),
    );

    return columnHelper.columns([
      columnHelper.display({
        id: 'month',
        header: 'Month',
        cell: (info) => <div className="py-1.5 pr-4 text-sm">{formatPeriodOrDays(info.row.original.month)}</div>,
      }),
      ...bucketNames.map((bucketName) =>
        columnHelper.display({
          id: `bucket-${bucketName}`,
          header: () => <div className="text-right">{bucketName}</div>,
          cell: (info) => {
            const point = pointsByMonthAndBucket.get(`${info.row.original.month.from}|${bucketName}`);

            if (!point) {
              return (
                <div className="py-1.5 pr-4 text-right text-sm">
                  <span className="text-zinc-500">-</span>
                </div>
              );
            }

            const cellText = `${point.batchCount} (${formatUsdCents(point.feeUsdCents)})`;

            return (
              <div className="py-1.5 pr-4 text-right text-sm">
                {point.sponsor === null ? (
                  cellText
                ) : (
                  <WithHoverTooltip
                    tooltip={`Value if paid: ${formatUsdCents(point.batchCount * BATCH_REVOKE_FEE_USD_CENTS)}`}
                  >
                    <span>{cellText}</span>
                  </WithHoverTooltip>
                )}
              </div>
            );
          },
        }),
      ),
    ]);
  }, [splitPoints]);

  const table = useTable({
    data: monthsNewestFirst,
    columns,
    getRowId: (row) => row.month.from,
    pageSize: 12,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Batch revoke split"
          subtitle="Batch revokes per UTC month in the selected period: paid fees vs waived (Revoke Premium) vs sponsored chains; counts and fee totals are client-reported"
        />
      }
      className="p-0"
    >
      <Table
        table={table}
        loading={isLoading}
        emptyChildren="No batch revokes recorded in the selected period"
        className={twMerge('border-none', isPlaceholderData && 'opacity-60')}
      />
    </Card>
  );
};

export default BatchRevokeSplitSection;
