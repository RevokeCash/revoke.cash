import Loader from 'components/common/Loader';
import { AllowanceData } from 'lib/interfaces';
import { calculateValueAtRisk, deduplicateArray } from 'lib/utils';
import { getChainPriceStrategy } from 'lib/utils/chains';
import { formatFiatAmount } from 'lib/utils/formatting';
import { isErc721Contract } from 'lib/utils/tokens';
import { useTranslations } from 'next-intl';

interface Props {
  chainId: number;
  allowances: AllowanceData[];
  isLoading: boolean;
  error?: Error;
}

const TotalValueAtRisk = ({ chainId, allowances, isLoading, error }: Props) => {
  const t = useTranslations();

  if (error) return null;

  const totalValueAtRisk = calculateTotalValueAtRisk(allowances ?? []);

  const hasNftsAtRisk = allowances?.some(
    (allowance) => !!allowance.spender && isErc721Contract(allowance.contract) && allowance.balance > 0n,
  );

  const priceStrategy = getChainPriceStrategy(chainId);
  const chainHasFungiblePriceStrategy = priceStrategy?.supportedAssets?.includes('ERC20');
  const chainHasNftPriceStrategy = priceStrategy?.supportedAssets?.includes('ERC721');

  return (
    <Loader isLoading={isLoading}>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-zinc-600 dark:text-zinc-400 text-center">
          {t('address.wallet_health.total_value_at_risk')}
        </div>
        <div className="font-bold">
          {isLoading ? (
            '$0,000'
          ) : chainHasFungiblePriceStrategy ? (
            <>
              {formatFiatAmount(totalValueAtRisk, 0)} {hasNftsAtRisk && !chainHasNftPriceStrategy ? '+ NFTs' : null}
            </>
          ) : (
            t('address.allowances.unknown')
          )}
        </div>
      </div>
    </Loader>
  );
};

export default TotalValueAtRisk;

const calculateTotalValueAtRisk = (allowances: AllowanceData[]): number => {
  const annotatedAllowances = allowances.map((allowance) => ({
    ...allowance,
    valueAtRisk: calculateValueAtRisk(allowance),
  }));

  const sortedAllowances = annotatedAllowances.sort((a, b) => (a.valueAtRisk > b.valueAtRisk ? -1 : 1));
  const deduplicatedAllowances = deduplicateArray(
    sortedAllowances,
    (a, b) => a.contract.address === b.contract.address,
  );

  return deduplicatedAllowances.reduce((acc, allowance) => acc + allowance.valueAtRisk || 0, 0);
};
