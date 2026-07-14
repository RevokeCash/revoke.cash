'use client';

import { deriveSponsorSplit } from '@revoke.cash/core/admin/revenue';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { createColumnHelper } from '@tanstack/react-table';
import Card, { CardTitle } from 'components/common/Card';
import Table from 'components/common/table/Table';
import { useAdminRevenueData } from 'lib/hooks/admin/useAdminRevenue';
import { useTable } from 'lib/hooks/useTable';
import { useMemo } from 'react';

const PAID_BUCKET = 'Paid';
const PREMIUM_BUCKET = 'Revoke Premium';

const columnHelper = createColumnHelper<string>();

const BatchRevokeSplitSection = () => {
  const { data, isLoading } = useAdminRevenueData(12);

  const splitPoints = useMemo(() => (data ? deriveSponsorSplit(data, 12) : []), [data]);

  const monthsNewestFirst = useMemo(
    () =>
      deduplicateArray(splitPoints.map((point) => point.month))
        .sort()
        .reverse(),
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
      splitPoints.map((point) => [`${point.month}|${point.sponsor ?? PAID_BUCKET}`, point]),
    );

    return [
      columnHelper.display({
        id: 'month',
        header: 'Month',
        cell: (info) => <div className="py-1.5 pr-4 text-sm">{info.row.original}</div>,
      }),
      ...bucketNames.map((bucketName) =>
        columnHelper.display({
          id: `bucket-${bucketName}`,
          header: () => <div className="text-right">{bucketName}</div>,
          cell: (info) => {
            const point = pointsByMonthAndBucket.get(`${info.row.original}|${bucketName}`);
            return (
              <div className="py-1.5 pr-4 text-right text-sm">
                {point ? (
                  `${point.batchCount} (${formatUsdCents(point.feeUsdCents)})`
                ) : (
                  <span className="text-zinc-500">-</span>
                )}
              </div>
            );
          },
        }),
      ),
    ];
  }, [splitPoints]);

  const table = useTable({
    data: monthsNewestFirst,
    columns,
    getRowId: (month) => month,
  });

  return (
    <Card
      header={
        <CardTitle
          title="Batch revoke split"
          subtitle="Batch revokes per UTC month: paid fees vs waived (Revoke Premium) vs sponsored chains; counts and fee totals are client-reported"
        />
      }
      className="p-0"
    >
      <Table
        table={table}
        loading={isLoading}
        emptyChildren="No batch revokes recorded in the last 12 months"
        className="border-none"
      />
    </Card>
  );
};

export default BatchRevokeSplitSection;
