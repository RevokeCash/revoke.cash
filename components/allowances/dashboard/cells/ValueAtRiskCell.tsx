import type { AllowanceData } from 'lib/interfaces';
import { calculateValueAtRisk } from 'lib/utils';
import { formatFiatAmount } from 'lib/utils/formatting';
import useTranslation from 'next-translate/useTranslation';
import { twMerge } from 'tailwind-merge';

interface Props {
  allowance: AllowanceData;
}

const ValueAtRiskCell = ({ allowance }: Props) => {
  const { t } = useTranslation();

  if (!allowance.spender) return null;

  const valueAtRisk = calculateValueAtRisk(allowance);
  const fiatBalanceText = formatFiatAmount(valueAtRisk);

  const classes = twMerge(
    'flex items-center justify-end gap-1 py-1 text-right font-monosans',
    !fiatBalanceText && 'text-zinc-500 dark:text-zinc-400',
  );

  return <div className={classes}>{fiatBalanceText ?? t('address:allowances.unknown')}</div>;
};

export default ValueAtRiskCell;
