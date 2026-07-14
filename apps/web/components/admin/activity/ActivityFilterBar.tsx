import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import { getChainName } from '@revoke.cash/core/chains';
import ChainLogo from 'components/common/ChainLogo';
import ChainLogoStack from 'components/common/ChainLogoStack';
import Checkbox from 'components/common/Checkbox';
import Input from 'components/common/Input';
import SearchableSelect from 'components/common/select/SearchableSelect';
import { twMerge } from 'tailwind-merge';
import { isAddress } from 'viem';

const ACTION_STATUSES: readonly ActionStatus[] = [
  'queued',
  'blocked_budget',
  'blocked_permission',
  'blocked_rules',
  'submitted',
  'succeeded',
  'failed',
  'skipped',
];

interface StatusOption {
  value: ActionStatus;
}

interface ChainOption {
  value: string;
  chainId: number;
}

const STATUS_OPTIONS: StatusOption[] = ACTION_STATUSES.map((status) => ({ value: status }));

const CHAIN_OPTIONS: ChainOption[] = AUTO_REVOKE_SUPPORTED_CHAINS.map((chainId) => ({
  value: getChainName(chainId),
  chainId,
}));

interface Props {
  selectedStatuses: ActionStatus[];
  selectedChainIds: number[];
  addressInput: string;
  showAddressFilter: boolean;
  onStatusesChange: (statuses: ActionStatus[]) => void;
  onChainIdsChange: (chainIds: number[]) => void;
  onAddressChange: (value: string) => void;
}

const ActivityFilterBar = ({
  selectedStatuses,
  selectedChainIds,
  addressInput,
  showAddressFilter,
  onStatusesChange,
  onChainIdsChange,
  onAddressChange,
}: Props) => {
  const trimmedAddress = addressInput.trim();
  const isInvalidAddress = trimmedAddress.length > 0 && !isAddress(trimmedAddress, { strict: false });

  const selectedStatusesSet = new Set(selectedStatuses);
  const selectedStatusOptions = STATUS_OPTIONS.filter((option) => selectedStatusesSet.has(option.value));

  const selectedChainIdsSet = new Set(selectedChainIds);
  const selectedChainOptions = CHAIN_OPTIONS.filter((option) => selectedChainIdsSet.has(option.chainId));
  const displayChainIds = selectedChainIds.length > 0 ? selectedChainIds : [...AUTO_REVOKE_SUPPORTED_CHAINS];

  const displayStatusOption = (option: StatusOption, context: 'menu' | 'value') => {
    if (context !== 'menu') return option.value;

    return (
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{option.value}</span>
        <Checkbox
          checked={selectedStatusesSet.has(option.value)}
          className="w-4 h-4 shrink-0 pointer-events-none"
          iconClassName="w-3.5 h-3.5"
        />
      </div>
    );
  };

  const displayChainOption = (option: ChainOption, context: 'menu' | 'value') => {
    if (context !== 'menu') return option.value;

    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ChainLogo chainId={option.chainId} checkMounted />
          <span className="truncate">{option.value}</span>
        </div>
        <Checkbox
          checked={selectedChainIdsSet.has(option.chainId)}
          className="w-4 h-4 shrink-0 pointer-events-none"
          iconClassName="w-3.5 h-3.5"
        />
      </div>
    );
  };

  const statusPlaceholder =
    selectedStatuses.length === 0
      ? 'All statuses'
      : selectedStatuses.length === 1
        ? selectedStatuses[0]
        : `${selectedStatuses.length} statuses`;

  const chainPlaceholder = (
    <div className="flex items-center min-w-0">
      <ChainLogoStack
        chainIds={displayChainIds}
        maxVisible={5}
        logoSize={20}
        overlapClassName="-space-x-2"
        itemClassName="ring-1"
        overflowClassName="h-5 min-w-5 text-[11px] bg-zinc-200 dark:bg-zinc-700 ring-1"
      />
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchableSelect
        instanceId="admin-activity-status-multi-select"
        aria-label="Filter by status"
        value={selectedStatusOptions}
        options={STATUS_OPTIONS}
        onChange={(options) => onStatusesChange(options.map((option) => option.value))}
        formatOptionLabel={displayStatusOption}
        menuPlacement="bottom"
        minMenuWidth="14.5rem"
        placeholder={statusPlaceholder}
        keepMounted
        isMulti
      />
      <SearchableSelect
        instanceId="admin-activity-chain-multi-select"
        aria-label="Filter by chain"
        value={selectedChainOptions}
        options={CHAIN_OPTIONS}
        onChange={(options) => onChainIdsChange(options.map((option) => option.chainId))}
        formatOptionLabel={displayChainOption}
        menuPlacement="bottom"
        minMenuWidth="14.5rem"
        placeholder={chainPlaceholder}
        keepMounted
        isMulti
      />
      {showAddressFilter && (
        <Input
          size="md"
          aria-label="Filter by wallet address"
          placeholder="Filter by wallet address"
          value={addressInput}
          onChange={(event) => onAddressChange(event.target.value)}
          className={twMerge(
            'w-full sm:w-100 font-mono text-sm',
            isInvalidAddress && 'border-red-500 dark:border-red-500',
          )}
        />
      )}
    </div>
  );
};

export default ActivityFilterBar;
