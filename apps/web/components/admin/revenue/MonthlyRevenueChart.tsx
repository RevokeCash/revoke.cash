'use client';

import { deriveMonthlySeries, type MonthlyRevenuePoint } from '@revoke.cash/core/admin/revenue';
import { formatFiatAmount, formatUsdCents } from '@revoke.cash/core/utils/formatting';
import Card, { CardTitle } from 'components/common/Card';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAdminRevenueData } from 'lib/hooks/admin/useAdminRevenue';
import { twMerge } from 'tailwind-merge';

const BAR_AREA_HEIGHT_PIXELS = 144;

const SUBSCRIPTIONS_COLOR_CLASSES = 'bg-[#2a78d6] dark:bg-[#3987e5]';
const BATCH_REVOKES_COLOR_CLASSES = 'bg-[#1baf7a] dark:bg-[#199e70]';

const MonthlyRevenueChart = () => {
  const { data, isLoading } = useAdminRevenueData(12);
  const monthly = data && deriveMonthlySeries(data, 12);

  const maxTotalUsdCents = Math.max(
    ...(monthly ?? []).map((point) => point.subscriptionsUsdCents + point.batchRevokesUsdCents),
    1,
  );

  return (
    <Card
      header={
        <CardTitle
          title="Monthly revenue"
          subtitle="Confirmed subscription payments and batch revoke fees per UTC month"
        />
      }
      isLoading={isLoading}
      className={twMerge('overflow-x-auto', isLoading && 'h-80')}
    >
      {monthly && (
        <div className="flex flex-col gap-3 min-w-xl">
          <div className="flex items-end gap-2 border-b border-zinc-200 dark:border-zinc-800">
            {monthly.map((point) => (
              <MonthlyRevenueBar key={point.month} point={point} maxTotalUsdCents={maxTotalUsdCents} />
            ))}
          </div>
          <div className="flex gap-2">
            {monthly.map((point) => (
              <span key={point.month} className="flex-1 text-center text-[10px] text-zinc-600 dark:text-zinc-400">
                {point.month}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${SUBSCRIPTIONS_COLOR_CLASSES}`} />
              Subscriptions
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${BATCH_REVOKES_COLOR_CLASSES}`} />
              Batch revoke fees
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

interface MonthlyRevenueBarProps {
  point: MonthlyRevenuePoint;
  maxTotalUsdCents: number;
}

const MonthlyRevenueBar = ({ point, maxTotalUsdCents }: MonthlyRevenueBarProps) => {
  const totalUsdCents = point.subscriptionsUsdCents + point.batchRevokesUsdCents;
  const subscriptionsHeight = segmentHeightPixels(point.subscriptionsUsdCents, maxTotalUsdCents);
  const batchRevokesHeight = segmentHeightPixels(point.batchRevokesUsdCents, maxTotalUsdCents);

  const tooltip = `${point.month}: ${formatUsdCents(point.subscriptionsUsdCents)} subscriptions + ${formatUsdCents(point.batchRevokesUsdCents)} batch revoke fees = ${formatUsdCents(totalUsdCents)}`;

  return (
    <WithHoverTooltip tooltip={tooltip}>
      <div
        className="flex-1 flex flex-col justify-end items-center gap-1"
        style={{ height: BAR_AREA_HEIGHT_PIXELS + 32 }}
      >
        <span className="text-[10px] text-zinc-600 dark:text-zinc-400">{formatUsdCentsRounded(totalUsdCents)}</span>
        <div className="w-full max-w-8 flex flex-col justify-end gap-0.5">
          {batchRevokesHeight > 0 && (
            <div
              className={`w-full ${BATCH_REVOKES_COLOR_CLASSES} rounded-t-sm`}
              style={{ height: batchRevokesHeight }}
            />
          )}
          {subscriptionsHeight > 0 && (
            <div
              className={`w-full ${SUBSCRIPTIONS_COLOR_CLASSES} ${batchRevokesHeight > 0 ? '' : 'rounded-t-sm'}`}
              style={{ height: subscriptionsHeight }}
            />
          )}
        </div>
      </div>
    </WithHoverTooltip>
  );
};

const segmentHeightPixels = (valueUsdCents: number, maxTotalUsdCents: number): number => {
  if (valueUsdCents === 0) return 0;
  return Math.max(2, Math.round((valueUsdCents / maxTotalUsdCents) * BAR_AREA_HEIGHT_PIXELS));
};

const formatUsdCentsRounded = (cents: number): string => formatFiatAmount(cents / 100, 0) ?? '$0';

export default MonthlyRevenueChart;
