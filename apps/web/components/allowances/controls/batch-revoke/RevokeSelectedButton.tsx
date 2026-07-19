import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { Table } from '@tanstack/react-table';
import { useState } from 'react';
import BatchRevokeModalWithButton from './BatchRevokeModalWithButton';
import RevokeSingleSelectedButton from './RevokeSingleSelectedButton';

interface Props {
  table: Table<TokenAllowanceData>;
}

const RevokeSelectedButton = ({ table }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const selectedAllowances = table.getGroupedSelectedRowModel().flatRows.map((row) => row.original);

  // Rows get deselected as their revokes confirm, so while the batch modal is open we must keep rendering
  // it: switching to the single-selection button mid-batch would unmount the modal and close it
  if (selectedAllowances.length === 1 && !modalOpen) {
    return <RevokeSingleSelectedButton table={table} allowance={selectedAllowances[0]} />;
  }

  return <BatchRevokeModalWithButton table={table} open={modalOpen} setOpen={setModalOpen} />;
};

export default RevokeSelectedButton;
