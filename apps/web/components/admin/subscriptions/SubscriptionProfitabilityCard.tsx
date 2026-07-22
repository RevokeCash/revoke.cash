'use client';

import type { AdminSubscriptionDetail } from '@revoke.cash/core/admin/subscriptions';
import { formatFiatAmount, formatUsdCents } from '@revoke.cash/core/utils/formatting';
import Card, { CardTitle } from 'components/common/Card';
import { twMerge } from 'tailwind-merge';

interface Props {
  subscription: AdminSubscriptionDetail;
}

const SubscriptionProfitabilityCard = ({ subscription }: Props) => {
  const { profitability, plan } = subscription;
  const isUltimate = plan.tier === 'ultimate';
  const netAfterGasUsdCents = profitability.revenueUsdCents - Math.round(profitability.gasSpendUsd * 100);
  const bottomLineUsdCents = netAfterGasUsdCents - profitability.missedBatchRevokeFeeUsdCents;

  return (
    <Card
      header={
        <CardTitle
          title="Profitability"
          subtitle="Lifetime revenue, gas costs, and waived batch revoke fees for this subscription"
        />
      }
    >
      <div className={isUltimate ? 'grid grid-cols-2 lg:grid-cols-5 gap-4' : 'grid grid-cols-2 lg:grid-cols-4 gap-4'}>
        <ProfitabilityTile
          label="Revenue"
          value={formatUsdCents(profitability.revenueUsdCents)}
          detail="Confirmed payments"
        />
        {isUltimate && (
          <ProfitabilityTile
            label="Gas spend"
            value={formatFiatAmount(profitability.gasSpendUsd) ?? '$0.00'}
            detail="Billed auto-revoke gas"
          />
        )}
        <ProfitabilityTile
          label="Missed batch revoke fees"
          value={formatUsdCents(profitability.missedBatchRevokeFeeUsdCents)}
          detail={`${profitability.missedBatchRevokeCount} fee-free batches`}
        />
        <ProfitabilityTile
          label="Net"
          value={formatUsdCents(netAfterGasUsdCents)}
          detail="Revenue minus gas spend"
          valueClassName={netAfterGasUsdCents < 0 ? 'text-red-600 dark:text-red-400' : undefined}
        />
        <ProfitabilityTile
          label="Bottom line"
          value={formatUsdCents(bottomLineUsdCents)}
          detail="Also minus missed batch fees"
          valueClassName={bottomLineUsdCents < 0 ? 'text-red-600 dark:text-red-400' : undefined}
        />
      </div>
    </Card>
  );
};

interface ProfitabilityTileProps {
  label: string;
  value: string;
  detail: string;
  valueClassName?: string;
}

const ProfitabilityTile = ({ label, value, detail, valueClassName }: ProfitabilityTileProps) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
    <span className={twMerge('text-2xl font-semibold', valueClassName)}>{value}</span>
    <span className="text-xs text-zinc-500 dark:text-zinc-500">{detail}</span>
  </div>
);

export default SubscriptionProfitabilityCard;
