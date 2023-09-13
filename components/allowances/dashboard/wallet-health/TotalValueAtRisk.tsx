import { deduplicateArray, calculateValueAtRisk } from 'lib/utils';
import Loader from 'components/common/Loader';
import useTranslation from 'next-translate/useTranslation';
import { getChainPriceStrategy } from 'lib/utils/chains';
import { isErc721Contract } from 'lib/utils/tokens';
import { AllowanceData } from 'lib/interfaces';
import { formatFiatAmount } from 'lib/utils/formatting';

interface Props {
  chainId: number;
  allowances: AllowanceData[];
  isLoading: boolean;
  error?: Error;
}

const TotalValueAtRisk = ({ chainId, allowances, isLoading, error }: Props) => {
  const { t } = useTranslation();

  if (error) return null;

  const totalValueAtRisk = deduplicateArray(
    (allowances ?? []).sort((a, b) => (a.amount > b.amount ? -1 : 1)),
    (a, b) => a.contract.address === b.contract.address,
  ).reduce((acc, allowance) => acc + calculateValueAtRisk(allowance) || 0, 0);

  const hasNftsAtRisk = allowances?.some(
    (allowance) =>
      !!allowance.spender &&
      isErc721Contract(allowance.contract) &&
      (allowance.balance === 'ERC1155' || allowance.balance > 0n),
  );

  const chainHasPricingInformation = !!getChainPriceStrategy(chainId);

  return (
    <Loader isLoading={isLoading}>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-zinc-600 dark:text-zinc-400">{t('address:wallet_health.total_value_at_risk')}</div>
        <div className="font-bold">
          {isLoading ? (
            '$0,000'
          ) : chainHasPricingInformation ? (
            <>
              {formatFiatAmount(totalValueAtRisk, 0)} {hasNftsAtRisk ? '+ NFTs' : null}
            </>
          ) : (
            t('address:allowances.unknown')
          )}
        </div>
      </div>
    </Loader>
  );
};

export default TotalValueAtRisk;
