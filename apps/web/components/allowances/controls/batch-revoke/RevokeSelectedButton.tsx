import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { Table } from '@tanstack/react-table';
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

  return <BatchRevokeModalWithButton table={table} />;
};

export default RevokeSelectedButton;
