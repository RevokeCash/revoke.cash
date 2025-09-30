import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AssetDisplay from 'components/allowances/dashboard/cells/AssetDisplay';
import Button from 'components/common/Button';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { ApprovalHistoryEvent } from '../utils';

interface Props {
  event: ApprovalHistoryEvent;
  onFilter?: (filterValue: string) => void;
}

const HistoryAssetCell = ({ event, onFilter }: Props) => {
  const asset = {
    metadata: event.metadata,
    chainId: event.chainId,
    contract: {
      address: event.token,
    },
  };

  const handleFilterClick = () => {
    if (onFilter) {
      const filterValue = event.token;
      onFilter(`token:${filterValue}`);
    }
  };

  const filterButton = (
    <WithHoverTooltip tooltip="Filter by this token">
      <Button
        style="none"
        size="none"
        onClick={handleFilterClick}
        aria-label={`Filter by token ${asset.metadata.symbol}`}
      >
        <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" />
      </Button>
    </WithHoverTooltip>
  );

  return (
    <div className="flex items-center gap-2 py-1 w-48 lg:w-56">
      <div className="flex flex-col items-center py-2">
        <AssetDisplay asset={asset} />
      </div>
      {onFilter ? filterButton : null}
    </div>
  );
};

export default HistoryAssetCell;
