import type { Table } from '@tanstack/react-table';
import type { TokenAllowanceData } from 'lib/utils/allowances';
import BatchRevokeModalWithButton from './BatchRevokeModalWithButton';
import RevokeSingleSelectedButton from './RevokeSingleSelectedButton';

interface Props {
  table: Table<TokenAllowanceData>;
}

const RevokeSelectedButton = ({ table }: Props) => {
  const selectedAllowances = table.getGroupedSelectedRowModel().flatRows.map((row) => row.original);

  if (selectedAllowances.length === 1) {
    return <RevokeSingleSelectedButton table={table} allowance={selectedAllowances[0]} />;
  }

  return <BatchRevokeModalWithButton table={table} selectedAllowances={selectedAllowances} />;
};

export default RevokeSelectedButton;
