import { calculateValueAtRisk, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isErc721 } from '@revoke.cash/core/tokens';
import { formatFiatAmount } from '@revoke.cash/core/utils/formatting';
import Loader from 'components/common/Loader';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  allowance: TokenAllowanceData;
}

const ValueAtRiskCell = ({ allowance }: Props) => {
  const t = useTranslations();

  if (isLoading(allowance)) {
    return <Loader isLoading className="h-6" />;
  }

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

const isLoading = (allowance: TokenAllowanceData) => {
  return !isErc721(allowance.token) && (allowance.metadata.price === undefined || allowance.balance === undefined);
};
