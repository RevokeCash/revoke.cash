import type { Table } from '@tanstack/react-table';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Checkbox from 'components/common/Checkbox';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { TokenAllowanceData } from 'lib/utils/allowances';

interface Props {
  table: Table<TokenAllowanceData>;
}

const GlobalSelectCell = ({ table }: Props) => {
  const { address, selectedChainId } = useAddressPageContext();
  const selectedCount = table.getSelectedRowModel().flatRows.length;
  const selectableCount = table.getRowModel().flatRows.filter((row) => row.getCanSelect()).length;
  const checked = selectedCount === selectableCount && selectableCount > 0;

  const indeterminate = table.getSelectedRowModel().flatRows.length > 0;

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
