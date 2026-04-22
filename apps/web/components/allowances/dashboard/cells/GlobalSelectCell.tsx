import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { Table } from '@tanstack/react-table';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Checkbox from 'components/common/Checkbox';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';

interface Props {
  table: Table<TokenAllowanceData>;
}

const GlobalSelectCell = ({ table }: Props) => {
  const { address } = useAddress();

  const selectedRows = table.getSelectedRowModel().flatRows;
  const selectedCount = selectedRows.length;
  const selectableCount = table.getRowModel().flatRows.filter((row) => row.getCanSelect()).length;
  const checked = selectedCount === selectableCount && selectableCount > 0;
  const indeterminate = selectedCount > 0;

  // Use the first selected row's chainId, or default to 1 if none selected
  const selectedChainId = selectedRows[0]?.original.chainId ?? 1;

  return (
    <ControlsWrapper
      chainId={selectedChainId}
      address={address}
      overrideDisabled={selectableCount === 0}
      skipSwitchChain
    >
      {(disabled) => (
        <div className="w-fit">
          <Checkbox
            disabled={disabled}
            checked={checked && !disabled}
            indeterminate={indeterminate && !disabled}
            onChange={table.getToggleAllRowsSelectedHandler()}
            iconClassName="max-sm:w-5 max-sm:h-5"
          />
        </div>
      )}
    </ControlsWrapper>
  );
};

export default GlobalSelectCell;
