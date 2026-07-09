import { calculateValueAtRisk, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isErc721 } from '@revoke.cash/core/tokens';
import type { Nullable } from '@revoke.cash/core/types';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { formatFiatAmount } from '@revoke.cash/core/utils/formatting';
import Loader from 'components/common/Loader';
import { useTranslations } from 'next-intl';

interface Props {
  allowances?: TokenAllowanceData[];
  isLoading: boolean;
  error?: Nullable<Error>;
  multichain?: boolean;
}

const TotalValueAtRisk = ({ allowances, isLoading, error, multichain }: Props) => {
  const t = useTranslations();

  if (error) return null;

  const totalValueAtRisk = calculateTotalValueAtRisk(allowances ?? []);

  const hasNftsAtRisk = allowances?.some(
    (allowance) =>
      isErc721(allowance.token) &&
      allowance.balance !== undefined &&
      (allowance.balance === 'Unknown' || allowance.balance > 0n),
  );

  return (
    <Loader isLoading={isLoading}>
      <div className="flex flex-col items-start md:items-center gap-0.5">
        <div className="text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-400 md:text-center uppercase">
          {t(multichain ? 'address.wallet_health.total_value_at_risk' : 'address.wallet_health.value_at_risk')}
        </div>
        <div className="font-bold">
          {isLoading ? (
            '$0,000'
          ) : isNullish(totalValueAtRisk) ? (
            t('address.allowances.unknown')
          ) : (
            <>
              {formatFiatAmount(totalValueAtRisk, 0)} {hasNftsAtRisk ? '+ NFTs' : null}
            </>
          )}
        </div>
      </div>
    </Loader>
  );
};

export default TotalValueAtRisk;

const calculateTotalValueAtRisk = (allowances: TokenAllowanceData[]): number | null => {
  const annotatedAllowances = allowances.map((allowance) => ({
    ...allowance,
    valueAtRisk: calculateValueAtRisk(allowance),
  }));

  const sortedAllowances = annotatedAllowances.sort((a, b) => ((a.valueAtRisk ?? 0n) > (b.valueAtRisk ?? 0n) ? -1 : 1));
  const deduplicatedAllowances = deduplicateArray(
    sortedAllowances,
    (allowance) => `${allowance.chainId}-${allowance.token.address}`,
  );

  // If no allowance has a known price, return null ("Unknown")
  const hasAnyPrice = deduplicatedAllowances.some((allowance) => !isNullish(allowance.metadata.price));
  if (!hasAnyPrice) return null;

  return deduplicatedAllowances.reduce((acc, allowance) => acc + (allowance.valueAtRisk ?? 0), 0);
};
