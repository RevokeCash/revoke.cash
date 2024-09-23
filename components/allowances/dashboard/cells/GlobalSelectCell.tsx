import { Table } from '@tanstack/react-table';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import IndeterminateCheckbox from 'components/common/IndeterminateCheckbox';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { AllowanceData } from 'lib/interfaces';

interface Props {
  table: Table<AllowanceData>;
}

const GlobalSelectCell = ({ table }: Props) => {
  const { address, selectedChainId } = useAddressPageContext();
  const selectedCount = table.getSelectedRowModel().flatRows.length;
  const selectableCount = table.getRowModel().flatRows.filter((row) => row.getCanSelect()).length;
  const checked = selectedCount === selectableCount;

  const indeterminate = table.getSelectedRowModel().flatRows.length > 0;

  return (
    <ControlsWrapper chainId={selectedChainId} address={address} overrideDisabled={table.getRowCount() === 0}>
      {(disabled) => (
        <div>
          <IndeterminateCheckbox
            disabled={disabled}
            checked={checked && !disabled}
            indeterminate={indeterminate && !disabled}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        </div>
      )}
    </ControlsWrapper>
  );
};

export default GlobalSelectCell;
