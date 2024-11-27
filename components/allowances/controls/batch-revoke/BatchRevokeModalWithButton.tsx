import { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useRevokeBatch } from 'lib/hooks/ethereum/useRevokeBatch';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { TokenAllowanceData } from 'lib/utils/allowances';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import ControlsWrapper from '../ControlsWrapper';
import BatchRevokeControls from './BatchRevokeControls';
import BatchRevokeHeader from './BatchRevokeHeader';
import BatchRevokeTable from './BatchRevokeTable';

interface Props {
  table: Table<TokenAllowanceData>;
}

const BatchRevokeModalWithButton = ({ table }: Props) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { address, selectedChainId } = useAddressPageContext();

  const selectedAllowances = useMemo(() => {
    return table.getGroupedSelectedRowModel().flatRows.map((row) => row.original);
  }, [open]);

  const { results, revoke, pause, isRevoking, isAllConfirmed } = useRevokeBatch(
    selectedAllowances,
    table.options.meta!.onUpdate,
  );

  useEffect(() => {
    if (!open) pause();
  }, [open]);

  const totalRevoked = Object.values(results).filter((result) => result.status === 'confirmed').length;
  const totalReverted = Object.values(results).filter((result) => result.status === 'reverted').length;

  if (!selectedAllowances || !results) return null;

  // Somehow, if filters are applied, getIsSomeRowsSelected() returns false if *all* rows are selected
  const isSomeRowsSelected = table.getIsSomeRowsSelected() || table.getIsAllRowsSelected();

  return (
    <>
      <ControlsWrapper chainId={selectedChainId} address={address} overrideDisabled={!isSomeRowsSelected}>
        {(disabled) => (
          <div className="w-fit">
            <Button style="primary" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
              {t('common.buttons.revoke_selected')}
            </Button>
          </div>
        )}
      </ControlsWrapper>
      <Modal open={open} setOpen={setOpen} className="sm:max-w-5xl min-h-[68vh] overflow-hidden" onlyExplicitClose>
        <div className="flex flex-col justify-between gap-4">
          <div>
            <BatchRevokeHeader
              totalRevoked={totalRevoked}
              totalReverted={totalReverted}
              totalSelected={selectedAllowances.length}
            />
            <div className="h-[46vh] w-full overflow-scroll whitespace-nowrap scrollbar-hide">
              <BatchRevokeTable selectedAllowances={selectedAllowances} results={results} />
            </div>
          </div>
          <BatchRevokeControls
            selectedAllowances={selectedAllowances}
            isRevoking={isRevoking}
            isAllConfirmed={isAllConfirmed}
            setOpen={setOpen}
            revoke={revoke}
          />
        </div>
      </Modal>
    </>
  );
};

export default BatchRevokeModalWithButton;
