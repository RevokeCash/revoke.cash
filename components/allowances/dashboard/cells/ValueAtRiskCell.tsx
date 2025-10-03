import Loader from 'components/common/Loader';
import { calculateValueAtRisk, type TokenAllowanceData } from 'lib/utils/allowances';
import { formatFiatAmount } from 'lib/utils/formatting';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  allowance: TokenAllowanceData;
}

const ValueAtRiskCell = ({ allowance }: Props) => {
  const t = useTranslations();

  if (allowance.metadata.price === undefined) return <Loader isLoading className="h-6" />;

  if (!allowance.payload) return null;

  const valueAtRisk = calculateValueAtRisk(allowance);
  const fiatBalanceText = formatFiatAmount(valueAtRisk);

  const classes = twMerge(
    'flex items-center justify-end gap-1 py-1 text-right font-monosans',
    !fiatBalanceText && 'text-zinc-500 dark:text-zinc-400',
  );

  return <div className={classes}>{fiatBalanceText ?? t('address.allowances.unknown')}</div>;
};

export default ValueAtRiskCell;
