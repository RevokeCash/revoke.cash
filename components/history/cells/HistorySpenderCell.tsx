import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import Button from 'components/common/Button';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { Nullable, SpenderRiskData } from 'lib/interfaces';
import type { Address } from 'viem';

interface Props {
  address: Address;
  chainId: number;
  spenderData?: Nullable<SpenderRiskData>;
  onFilter?: (filterValue: string) => void;
}

const HistorySpenderCell = ({ address, spenderData, chainId, onFilter }: Props) => {
  const handleFilterClick = () => {
    if (onFilter) {
      onFilter(`spender:${address}`);
    }
  };

  const filterButton = (
    <WithHoverTooltip tooltip="Filter by this spender">
      <Button style="none" size="none" onClick={handleFilterClick} aria-label={`Filter by spender ${address}`}>
        <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" />
      </Button>
    </WithHoverTooltip>
  );

  return (
    <div className="flex items-center gap-2">
      <AddressCell address={address} chainId={chainId} spenderData={spenderData ?? undefined} />
      {onFilter ? filterButton : null}
    </div>
  );
};

export default HistorySpenderCell;
