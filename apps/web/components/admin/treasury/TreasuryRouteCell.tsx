'use client';

import { MINIMUM_MOVED_VALUE_USD, type TreasuryRoute } from '@revoke.cash/core/admin/treasury-routes';
import { formatFiatAmount, parseFixedPointBigInt } from '@revoke.cash/core/utils/formatting';
import StatusLabel, { type Status } from 'components/common/StatusLabel';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { twMerge } from 'tailwind-merge';
import type { TreasuryBalanceRow } from './TreasuryBalancesTable';

interface Props {
  row: TreasuryBalanceRow;
}

const TreasuryRouteCell = ({ row }: Props) => {
  const nextStep = getNextStep(row);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStep && <StatusLabel status={nextStep.status}>{nextStep.label}</StatusLabel>}
      {row.route && (
        <span className={twMerge(nextStep?.status === 'neutral' && 'text-zinc-500 dark:text-zinc-400')}>
          <RouteDescription route={row.route} />
        </span>
      )}
    </div>
  );
};

const RouteDescription = ({ route }: { route: TreasuryRoute }) => {
  const destination = `${route.asset} on ${route.network}`;

  if (route.type === 'bridge') {
    const description = `${route.tool} to ${destination}`;
    if (!route.steps) return description;

    return (
      <WithHoverTooltip tooltip={route.steps}>
        <span>{description}</span>
      </WithHoverTooltip>
    );
  }

  const method = route.method ? `Kraken method '${route.method}', minimum` : 'Kraken minimum';

  return (
    <WithHoverTooltip tooltip={`${method} deposit: ${route.minimumDeposit} ${route.asset}`}>
      <span>Kraken: {destination}</span>
    </WithHoverTooltip>
  );
};

const getNextStep = (row: TreasuryBalanceRow): { status: Status; label: string } | null => {
  const { route, balance, balanceUsd, decimals, missingGasToken } = row;

  if (balanceUsd !== null && balanceUsd < MINIMUM_MOVED_VALUE_USD) {
    return { status: 'neutral', label: `Below ${formatFiatAmount(MINIMUM_MOVED_VALUE_USD, 0)}` };
  }

  if (!route) return { status: 'warning', label: 'No known route' };

  // Balances without a known value cannot be compared with the thresholds, so they only show their route
  if (balance === null || balanceUsd === null) return null;

  // Kraken does not credit deposits below its minimum, so they would be lost
  if (route.type === 'kraken' && BigInt(balance) < parseFixedPointBigInt(route.minimumDeposit, decimals)) {
    return { status: 'danger', label: 'Below Kraken minimum' };
  }

  if (missingGasToken) return { status: 'warning', label: `No ${missingGasToken} for gas` };

  if (route.type === 'kraken') return { status: 'success', label: 'Send to Kraken' };
  return { status: 'info', label: 'Bridge first' };
};

export default TreasuryRouteCell;
