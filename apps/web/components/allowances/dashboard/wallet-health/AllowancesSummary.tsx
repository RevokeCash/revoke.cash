import { useAddressAllowances } from 'lib/hooks/page-context/AddressPageContext';
import AllowancesCount from './AllowanceCount';
import TotalValueAtRisk from './TotalValueAtRisk';

const AllowancesSummary = () => {
  const { allowances, isLoading, error } = useAddressAllowances();

  if (error) return null;

  return (
    <div className="flex justify-start items-start md:items-center md:justify-around gap-4">
      <AllowancesCount allowances={allowances} isLoading={isLoading} error={error} />
      <TotalValueAtRisk allowances={allowances} isLoading={isLoading} error={error} />
    </div>
  );
};

export default AllowancesSummary;
