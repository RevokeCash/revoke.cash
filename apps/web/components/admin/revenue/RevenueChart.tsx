'use client';

import { deriveRevenueSeries, type RevenueSeriesPoint } from '@revoke.cash/core/admin/revenue';
import { formatFiatAmount, formatUsdCents } from '@revoke.cash/core/utils/formatting';
import DateRangePicker from 'components/admin/common/date-range-picker/DateRangePicker';
import StatTile from 'components/admin/common/StatTile';
import Card, { CardHeader } from 'components/common/Card';
import SegmentedControl, { type SegmentedOption } from 'components/common/SegmentedControl';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import {
  clampToToday,
  countDays,
  type DateRange,
  formatDayRange,
  formatMonthAndDay,
  formatPeriodOrDays,
  formatShortPeriodName,
  getPeriod,
  getStartedPeriods,
  getToday,
  isSameRange,
  type Period,
} from 'lib/admin/date-range';
import { useAdminRevenueDataSince } from 'lib/hooks/admin/useAdminRevenue';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

type ChartUnit = 'month' | 'week' | 'day';

const UNIT_OPTIONS: SegmentedOption<ChartUnit>[] = [
  { value: 'month', label: 'Monthly' },
  { value: 'week', label: 'Weekly' },
  { value: 'day', label: 'Daily' },
];

const BAR_AREA_HEIGHT_PIXELS = 144;
// Each bar keeps at least this much width (bar plus gap), so a year of days still fits a desktop card
const MINIMUM_BAR_SLOT_PIXELS = 2;
const MINIMUM_CHART_WIDTH_PIXELS = 576;
const MAXIMUM_BARS_WITH_VALUE_LABELS = 16;
const MAXIMUM_AXIS_LABELS = 12;

const SUBSCRIPTIONS_COLOR_CLASSES = 'bg-[#2a78d6] dark:bg-[#3987e5]';
const BATCH_REVOKES_COLOR_CLASSES = 'bg-[#1baf7a] dark:bg-[#199e70]';
const AVERAGE_LINE_COLOR_CLASSES = 'border-zinc-500 dark:border-zinc-400';
const MEDIAN_LINE_COLOR_CLASSES = 'border-[#eb6834] dark:border-[#d95926]';

interface Props {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const RevenueChart = ({ range, onRangeChange }: Props) => {
  const [unit, setUnit] = useState<ChartUnit>('month');
  const { data, isLoading, isPlaceholderData, error } = useAdminRevenueDataSince(range.from);

  const today = getToday();
  const buckets = getStartedPeriods(range, unit, today);
  const series = data && deriveRevenueSeries(data, buckets);
  const total = series && sumSeries(series);
  const average = total && getAveragePerPeriod(total, countElapsedPeriods(buckets, today));
  const averageTotalUsdCents = average ? getTotalUsdCents(average) : 0;
  const completePeriodTotalsUsdCents = (series ?? [])
    .filter((point) => isCompletePeriod(point.bucket, today))
    .map(getTotalUsdCents);
  const medianTotalUsdCents = completePeriodTotalsUsdCents.length > 0 ? getMedian(completePeriodTotalsUsdCents) : null;
  const unitLabel = UNIT_OPTIONS.find((option) => option.value === unit)?.label;

  const maxTotalUsdCents = Math.max(...(series ?? []).map(getTotalUsdCents), 1);
  const showsValueLabels = buckets.length <= MAXIMUM_BARS_WITH_VALUE_LABELS;
  // Long daily ranges label the first day of each month, so the labels line up with the months
  const labelsMonthStarts = unit === 'day' && buckets.length > 180;
  const axisLabelInterval = Math.ceil(buckets.length / MAXIMUM_AXIS_LABELS);
  const showsAxisLabel = (bucket: Period, index: number): boolean =>
    labelsMonthStarts ? bucket.from.endsWith('-01') : index % axisLabelInterval === 0;
  const barGapClassName =
    buckets.length > 60 ? 'gap-px' : buckets.length > MAXIMUM_BARS_WITH_VALUE_LABELS ? 'gap-1' : 'gap-2';

  return (
    <Card
      header={
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl">{unitLabel} revenue</h2>
              <p>Confirmed subscription payments and batch revoke fees per UTC {unit} in the selected period</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl size="sm" options={UNIT_OPTIONS} value={unit} onChange={setUnit} />
              <DateRangePicker value={range} onChange={onRangeChange} />
            </div>
          </div>
        </CardHeader>
      }
      isLoading={isLoading}
      error={error}
      className={twMerge(isLoading && 'h-80')}
    >
      {series && total && average && (
        <div
          className={twMerge('flex flex-col gap-3 transition-opacity duration-150', isPlaceholderData && 'opacity-60')}
        >
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatTile
              label="Total"
              value={formatUsdCents(getTotalUsdCents(total))}
              detail={`${formatUsdCents(total.subscriptionsUsdCents)} subscriptions + ${formatUsdCents(total.batchRevokesUsdCents)} batch revoke fees`}
            />
            <StatTile
              label={`Average per ${unit}`}
              value={formatUsdCents(averageTotalUsdCents)}
              detail={`${formatUsdCents(average.subscriptionsUsdCents)} subscriptions + ${formatUsdCents(average.batchRevokesUsdCents)} batch revoke fees`}
            />
            <StatTile
              label={`Median per ${unit}`}
              value={medianTotalUsdCents === null ? '-' : formatUsdCents(medianTotalUsdCents)}
              detail={
                medianTotalUsdCents === null
                  ? `No complete ${unit} in the selected period`
                  : `Over ${completePeriodTotalsUsdCents.length} complete ${unit}${completePeriodTotalsUsdCents.length === 1 ? '' : 's'}`
              }
            />
          </div>
          {/* Spans the card padding, so the axis labels of the first and last bar can extend past the chart edges */}
          <div className="-mx-4 overflow-x-auto px-4">
            <div
              className="flex flex-col gap-3"
              style={{ minWidth: Math.max(MINIMUM_CHART_WIDTH_PIXELS, buckets.length * MINIMUM_BAR_SLOT_PIXELS) }}
            >
              <div
                className={twMerge(
                  'relative flex items-end border-b border-zinc-200 dark:border-zinc-800',
                  barGapClassName,
                )}
              >
                {series.map((point) => (
                  <RevenueBar
                    key={point.bucket.from}
                    point={point}
                    maxTotalUsdCents={maxTotalUsdCents}
                    showsValueLabel={showsValueLabels}
                  />
                ))}
                {averageTotalUsdCents > 0 && (
                  <div
                    aria-hidden
                    className={twMerge(
                      'pointer-events-none absolute inset-x-0 border-t border-dashed',
                      AVERAGE_LINE_COLOR_CLASSES,
                    )}
                    style={{ bottom: segmentHeightPixels(averageTotalUsdCents, maxTotalUsdCents) }}
                  />
                )}
                {medianTotalUsdCents !== null && medianTotalUsdCents > 0 && (
                  <div
                    aria-hidden
                    className={twMerge(
                      'pointer-events-none absolute inset-x-0 border-t-2 border-dotted',
                      MEDIAN_LINE_COLOR_CLASSES,
                    )}
                    style={{ bottom: segmentHeightPixels(medianTotalUsdCents, maxTotalUsdCents) }}
                  />
                )}
              </div>
              <div className={twMerge('flex h-3', barGapClassName)}>
                {buckets.map((bucket, index) => (
                  <span key={bucket.from} className="relative min-w-0 flex-1">
                    {showsAxisLabel(bucket, index) && (
                      <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-zinc-600 dark:text-zinc-400">
                        {formatAxisLabel(bucket)}
                      </span>
                    )}
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
                <span className="flex items-center gap-1.5">
                  <span className={twMerge('w-3 border-t border-dashed', AVERAGE_LINE_COLOR_CLASSES)} />
                  Average
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={twMerge('w-3 border-t-2 border-dotted', MEDIAN_LINE_COLOR_CLASSES)} />
                  Median
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

interface RevenueBarProps {
  point: RevenueSeriesPoint<Period>;
  maxTotalUsdCents: number;
  showsValueLabel: boolean;
}

const RevenueBar = ({ point, maxTotalUsdCents, showsValueLabel }: RevenueBarProps) => {
  const totalUsdCents = getTotalUsdCents(point);
  const subscriptionsHeight = segmentHeightPixels(point.subscriptionsUsdCents, maxTotalUsdCents);
  const batchRevokesHeight = segmentHeightPixels(point.batchRevokesUsdCents, maxTotalUsdCents);

  const tooltip = (
    <div className="flex flex-col gap-1.5 py-1 text-left">
      <span className="font-medium">{formatBucketTitle(point.bucket)}</span>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 tabular-nums">
        <span className={twMerge('size-2.5 rounded-sm', SUBSCRIPTIONS_COLOR_CLASSES)} />
        <span className="text-zinc-600 dark:text-zinc-400">Subscriptions</span>
        <span className="text-right">{formatUsdCents(point.subscriptionsUsdCents)}</span>
        <span className={twMerge('size-2.5 rounded-sm', BATCH_REVOKES_COLOR_CLASSES)} />
        <span className="text-zinc-600 dark:text-zinc-400">Batch revoke fees</span>
        <span className="text-right">{formatUsdCents(point.batchRevokesUsdCents)}</span>
        <span className="col-span-3 border-t border-zinc-300 dark:border-zinc-600" />
        <span className="col-span-2 font-medium">Total</span>
        <span className="text-right font-medium">{formatUsdCents(totalUsdCents)}</span>
      </div>
    </div>
  );

  return (
    <WithHoverTooltip tooltip={tooltip}>
      <div
        className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
        style={{ height: BAR_AREA_HEIGHT_PIXELS + 32 }}
      >
        {showsValueLabel && (
          <span className="text-[10px] text-zinc-600 dark:text-zinc-400">{formatUsdCentsRounded(totalUsdCents)}</span>
        )}
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

type RevenueAmounts = Omit<RevenueSeriesPoint<Period>, 'bucket'>;

const getTotalUsdCents = (amounts: RevenueAmounts): number =>
  amounts.subscriptionsUsdCents + amounts.batchRevokesUsdCents;

const sumSeries = (series: RevenueSeriesPoint<Period>[]): RevenueAmounts => ({
  subscriptionsUsdCents: series.reduce((total, point) => total + point.subscriptionsUsdCents, 0),
  batchRevokesUsdCents: series.reduce((total, point) => total + point.batchRevokesUsdCents, 0),
});

// Periods cut short by the range or by today count pro rata, so a running month does not pull the average down
const countElapsedPeriods = (buckets: Period[], today: string): number =>
  buckets.reduce(
    (total, bucket) => total + countDays(clampToToday(bucket, today)) / countDays(getPeriod(bucket.unit, bucket.from)),
    0,
  );

const getAveragePerPeriod = (total: RevenueAmounts, elapsedPeriodCount: number): RevenueAmounts => ({
  subscriptionsUsdCents: total.subscriptionsUsdCents / elapsedPeriodCount,
  batchRevokesUsdCents: total.batchRevokesUsdCents / elapsedPeriodCount,
});

// The median only counts whole periods that have ended, since a clipped or running period would pull it down
const isCompletePeriod = (bucket: Period, today: string): boolean =>
  isSameRange(bucket, getPeriod(bucket.unit, bucket.from)) && bucket.to < today;

const getMedian = (values: number[]): number => {
  const sortedValues = [...values].sort((first, second) => first - second);
  const middleIndex = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 1) return sortedValues[middleIndex];
  return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
};

// Months read 'September 2026'; weeks and days read as their dates, 'Sep 14 – 20, 2026' and 'Sep 14, 2026'
const formatBucketTitle = (bucket: Period): string =>
  bucket.unit === 'month' ? formatPeriodOrDays(bucket) : formatDayRange(bucket);

// Months read 'Sep 2026'; weeks and days read as the first day they cover, 'Sep 14'
const formatAxisLabel = (bucket: Period): string =>
  bucket.unit === 'month' ? formatShortPeriodName(bucket) : formatMonthAndDay(bucket.from);

const segmentHeightPixels = (valueUsdCents: number, maxTotalUsdCents: number): number => {
  if (valueUsdCents === 0) return 0;
  return Math.max(2, Math.round((valueUsdCents / maxTotalUsdCents) * BAR_AREA_HEIGHT_PIXELS));
};

const formatUsdCentsRounded = (cents: number): string => formatFiatAmount(cents / 100, 0) ?? '$0';

export default RevenueChart;
