import Spinner from 'components/common/Spinner';
import { useAddressAllowances } from 'lib/hooks/page-context/AddressPageContext';
import { deduplicateArray } from 'lib/utils';
import { hasZeroBalance } from 'lib/utils/tokens';
import { useMemo } from 'react';
import DashboardPanel from '../DashboardPanel';
import PermitsEntry from './PermitsEntry';

const PermitsPanel = () => {
  const { allowances, isLoading } = useAddressAllowances();

  const permitTokens = useMemo(() => {
    const filtered = (allowances ?? []).filter((allowance) => allowance.supportsPermit && !hasZeroBalance(allowance));
    return deduplicateArray(filtered, (a, b) => a.contract.address === b.contract.address);
  }, [allowances]);

  if (isLoading) {
    return (
      <DashboardPanel title="Permit Signatures" className="w-full flex justify-center items-center h-12">
        <Spinner className="w-6 h-6" />
      </DashboardPanel>
    );
  }

  if (permitTokens.length === 0) {
    return (
      <DashboardPanel title="Permit Signatures" className="w-full flex justify-center items-center h-12">
        <p className="text-center">No tokens with Permit support found.</p>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel title="Permit Signatures" className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <div className="w-full">
        {permitTokens.map((token) => (
          <PermitsEntry key={token.contract.address} token={token} />
        ))}
      </div>
    </DashboardPanel>
  );
};

export default PermitsPanel;
