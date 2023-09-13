import { useAddressAllowances } from 'lib/hooks/page-context/AddressPageContext';
import AllowancesCount from './AllowanceCount';
import TotalValueAtRisk from './TotalValueAtRisk';

interface Props {
  chainId: number;
}

const AllowancesSummary = ({ chainId }: Props) => {
  const { allowances, isLoading, error } = useAddressAllowances();

  return (
    <div className="flex items-center justify-around gap-4 h-16 only:w-full only:justify-center">
      <AllowancesCount allowances={allowances} isLoading={isLoading} error={error} />
      <TotalValueAtRisk chainId={chainId} allowances={allowances} isLoading={isLoading} error={error} />
    </div>
  );
};

export default AllowancesSummary;
