import { Table } from '@tanstack/react-table';
import AssetCell from 'components/allowances/dashboard/cells/AssetCell';
import SpenderCell from 'components/allowances/dashboard/cells/SpenderCell';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useRevokeBatch } from 'lib/hooks/ethereum/useRevokeBatch';
import { AllowanceData } from 'lib/interfaces';
import { getAllowanceKey } from 'lib/utils/allowances';
import { useEffect, useMemo, useState } from 'react';
import StatusCell from '../dashboard/cells/StatusCell';
import TransactionHashCell from '../dashboard/cells/TransactionHashCell';

interface Props {
  table: Table<AllowanceData>;
}

const BatchRevokeModalWithButton = ({ table }: Props) => {
  const [open, setOpen] = useState(false);

  const allowances = useMemo(() => {
    return table.getGroupedSelectedRowModel().flatRows.map((row) => row.original);
  }, [open]);

  const { results, revoke, pause, isLoading } = useRevokeBatch(allowances, table.options.meta.onUpdate);

  useEffect(() => {
    if (!open) pause();
  }, [open]);

  const totalRevoked = Object.values(results).filter((result) => result.status === 'confirmed').length;
  const totalReverted = Object.values(results).filter((result) => result.status === 'reverted').length;

  if (!allowances || !results) return null;

  return (
    <>
      <Button style="primary" size="sm" disabled={!table.getIsSomeRowsSelected()} onClick={() => setOpen(true)}>
        Revoke Selected
      </Button>
      <Modal open={open} setOpen={setOpen} className="sm:max-w-5xl max-h-[70vh] overflow-hidden">
        <div>
          <h2 className="text-center text-2xl">Batch Revoke</h2>
          <div className="text-center mb-4 text-sm text-zinc-500">
            Revoked: {totalRevoked} | Failed: {totalReverted} | Total: {allowances.length}
          </div>
          <div className="h-[52vh] w-full overflow-scroll whitespace-nowrap scrollbar-hide">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-50">
                <tr>
                  <th className="py-2">#</th>
                  <th>Asset</th>
                  <th>Approved Spender</th>
                  <th>Status</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {allowances.map((allowance, index) => (
                  <tr key={getAllowanceKey(allowance)}>
                    <td className="text-zinc-500">{index + 1}</td>
                    <td className="py-1">
                      <AssetCell asset={allowance} />
                    </td>
                    <td>
                      <SpenderCell allowance={allowance} />
                    </td>
                    <td>
                      <StatusCell
                        status={results[getAllowanceKey(allowance)]?.status}
                        reason={results[getAllowanceKey(allowance)]?.error}
                      />
                    </td>
                    <td>
                      <TransactionHashCell
                        chainId={allowance.chainId}
                        transactionHash={results[getAllowanceKey(allowance)]?.transactionHash}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="h-12 mt-4 flex items-center justify-center gap-4">
            <Button style="primary" size="md" className="px-16" onClick={revoke} loading={isLoading}>
              {isLoading ? 'Revoking' : 'Revoke'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BatchRevokeModalWithButton;
