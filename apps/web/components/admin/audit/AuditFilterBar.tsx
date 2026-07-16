import { AUDIT_ACTIONS, type AuditAction } from '@revoke.cash/core/audit/actions';
import Checkbox from 'components/common/Checkbox';
import Input from 'components/common/Input';
import SearchableSelect from 'components/common/select/SearchableSelect';
import { twMerge } from 'tailwind-merge';
import { isAddress } from 'viem';

interface ActionOption {
  value: AuditAction;
}

const ACTION_OPTIONS: ActionOption[] = AUDIT_ACTIONS.map((action) => ({ value: action }));

interface Props {
  selectedActions: AuditAction[];
  addressInput: string;
  showAddressFilter: boolean;
  onActionsChange: (actions: AuditAction[]) => void;
  onAddressChange: (value: string) => void;
}

const AuditFilterBar = ({
  selectedActions,
  addressInput,
  showAddressFilter,
  onActionsChange,
  onAddressChange,
}: Props) => {
  const trimmedAddress = addressInput.trim();
  const isInvalidAddress = trimmedAddress.length > 0 && !isAddress(trimmedAddress, { strict: false });

  const selectedActionsSet = new Set(selectedActions);
  const selectedActionOptions = ACTION_OPTIONS.filter((option) => selectedActionsSet.has(option.value));

  const displayActionOption = (option: ActionOption, context: 'menu' | 'value') => {
    if (context !== 'menu') return option.value;

    return (
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{option.value}</span>
        <Checkbox
          checked={selectedActionsSet.has(option.value)}
          className="w-4 h-4 shrink-0 pointer-events-none"
          iconClassName="w-3.5 h-3.5"
        />
      </div>
    );
  };

  const actionPlaceholder =
    selectedActions.length === 0
      ? 'All actions'
      : selectedActions.length === 1
        ? selectedActions[0]
        : `${selectedActions.length} actions`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchableSelect
        instanceId="admin-audit-action-multi-select"
        aria-label="Filter by action"
        value={selectedActionOptions}
        options={ACTION_OPTIONS}
        onChange={(options) => onActionsChange(options.map((option) => option.value))}
        formatOptionLabel={displayActionOption}
        menuPlacement="bottom"
        minMenuWidth="14.5rem"
        placeholder={actionPlaceholder}
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

export default AuditFilterBar;
