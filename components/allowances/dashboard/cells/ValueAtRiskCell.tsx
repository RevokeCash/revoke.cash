import type { AllowanceData } from 'lib/interfaces';
import { formatFiatAmount, getValueAtRisk } from 'lib/utils';
import { twMerge } from 'tailwind-merge';

interface Props {
  allowance: AllowanceData;
}

const ValueAtRiskCell = ({ allowance }: Props) => {
  if (!allowance.spender) return null;

  const valueAtRisk = getValueAtRisk(allowance);
  const fiatBalanceText = formatFiatAmount(valueAtRisk);

  const classes = twMerge(
    'flex items-center justify-end gap-1 py-1 text-right font-monosans',
    !fiatBalanceText && 'text-zinc-500 dark:text-zinc-400',
    !!fiatBalanceText && 'underline decoration-yellow-500',
    !!fiatBalanceText && valueAtRisk < 1 && 'underline decoration-green-500',
    !!fiatBalanceText && valueAtRisk >= 1000 && 'underline decoration-red-500',
  );

  return <div className={classes}>{fiatBalanceText ?? 'Unknown'}</div>;
};

export default ValueAtRiskCell;
