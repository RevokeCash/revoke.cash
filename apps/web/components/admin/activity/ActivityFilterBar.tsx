import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import Checkbox from 'components/common/Checkbox';
import Input from 'components/common/Input';
import ChainMultiSelect from 'components/common/select/ChainMultiSelect';
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

const STATUS_OPTIONS: StatusOption[] = ACTION_STATUSES.map((status) => ({ value: status }));

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

  const statusPlaceholder =
    selectedStatuses.length === 0
      ? 'All statuses'
      : selectedStatuses.length === 1
        ? selectedStatuses[0]
        : `${selectedStatuses.length} statuses`;

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
      <ChainMultiSelect
        instanceId="admin-activity-chain-multi-select"
        aria-label="Filter by chain"
        chainIds={AUTO_REVOKE_SUPPORTED_CHAINS}
        selectedChainIds={selectedChainIds}
        onChange={onChainIdsChange}
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
