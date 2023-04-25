import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Spinner from 'components/common/Spinner';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
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

  const title = (
    <div className="flex items-center gap-2">
      <div>Permit Signatures</div>
      <WithHoverTooltip tooltip="Permit Signatures are used to approve allowances without a transaction. You should only cancel these if you signed a Permit signature on a scam website.">
        <div>
          <InformationCircleIcon className="w-4 h-4" />
        </div>
      </WithHoverTooltip>
    </div>
  );

  if (isLoading || permitTokens.length === 0) {
    return (
      <DashboardPanel title={title} className="w-full flex justify-center items-center h-12">
        <Spinner className="w-6 h-6" />
      </DashboardPanel>
    );
  }

  if (permitTokens.length === 0) {
    return (
      <DashboardPanel title={title} className="w-full flex justify-center items-center h-12">
        <p className="text-center">No tokens with Permit support found.</p>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <div className="w-full">
        {permitTokens.map((token) => (
          <PermitsEntry key={token.contract.address} token={token} />
        ))}
      </div>
    </DashboardPanel>
  );
};

export default PermitsPanel;
