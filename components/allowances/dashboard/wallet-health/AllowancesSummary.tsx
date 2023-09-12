import { Address } from 'viem';
import { useAddressAllowances } from 'lib/hooks/page-context/AddressPageContext';
import { deduplicateArray, formatFiatAmount, getValueAtRisk } from 'lib/utils';
import Loader from 'components/common/Loader';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  address: Address;
  chainId: number;
}

const AllowancesSummary = ({ address, chainId }: Props) => {
  const { t } = useTranslation();
  const { allowances, isLoading } = useAddressAllowances();

  const totalAllowances = allowances?.filter((allowance) => !!allowance.spender).length;
  const totalValueAtRisk = deduplicateArray(
    (allowances ?? []).sort((a, b) => (a.amount > b.amount ? -1 : 1)),
    (a, b) => a.contract.address === b.contract.address,
  ).reduce((acc, allowance) => acc + getValueAtRisk(allowance) || 0, 0);

  return (
    <div className="flex items-center justify-around gap-4 h-16">
      <Loader isLoading={isLoading}>
        <div className="flex flex-col items-center gap-0.5">
          <div className="text-zinc-600 dark:text-zinc-400">{t('address:wallet_health.total_allowances')}</div>
          <div className="font-bold">{isLoading ? '000' : totalAllowances}</div>
        </div>
      </Loader>
      <Loader isLoading={isLoading}>
        <div className="flex flex-col items-center gap-0.5">
          <div className="text-zinc-600 dark:text-zinc-400">{t('address:wallet_health.total_value_at_risk')}</div>
          <div className="font-bold">{isLoading ? '$0,000' : formatFiatAmount(totalValueAtRisk, 0)}</div>
        </div>
      </Loader>
    </div>
  );
};

export default AllowancesSummary;
