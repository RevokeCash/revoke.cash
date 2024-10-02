import { Table } from '@tanstack/react-table';
import AssetCell from 'components/allowances/dashboard/cells/AssetCell';
import SpenderCell from 'components/allowances/dashboard/cells/SpenderCell';
import Button from 'components/common/Button';
import TipSection from 'components/common/donate/TipSection';
import Modal from 'components/common/Modal';
import { useDonate } from 'lib/hooks/ethereum/useDonate';
import { useRevokeBatch } from 'lib/hooks/ethereum/useRevokeBatch';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { AllowanceData } from 'lib/interfaces';
import { getAllowanceKey } from 'lib/utils/allowances';
import { track } from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import StatusCell from '../dashboard/cells/StatusCell';
import TransactionHashCell from '../dashboard/cells/TransactionHashCell';
import ControlsWrapper from './ControlsWrapper';

interface Props {
  table: Table<AllowanceData>;
}

const BatchRevokeModalWithButton = ({ table }: Props) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { address, selectedChainId } = useAddressPageContext();
  const { donate, nativeToken, defaultAmount } = useDonate(selectedChainId, 'batch-revoke-tip');
  const [tipAmount, setTipAmount] = useState<string | null>(null);

  const selectedAllowances = useMemo(() => {
    return table.getGroupedSelectedRowModel().flatRows.map((row) => row.original);
  }, [open]);

  const { results, revoke, pause, isLoading } = useRevokeBatch(selectedAllowances, table.options.meta.onUpdate);

  const revokeAndTip = async () => {
    track('Batch Revoked', {
      chainId: selectedChainId,
      address,
      allowances: selectedAllowances.length,
      amount: tipAmount,
    });

    await revoke();
    await donate(tipAmount);
  };

  useEffect(() => {
    if (!open) pause();
    setTipAmount(null);
  }, [open]);

  const totalRevoked = Object.values(results).filter((result) => result.status === 'confirmed').length;
  const totalReverted = Object.values(results).filter((result) => result.status === 'reverted').length;

  if (!selectedAllowances || !results) return null;

  return (
    <>
      <ControlsWrapper chainId={selectedChainId} address={address} overrideDisabled={!table.getIsSomeRowsSelected()}>
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
            <h2 className="text-center text-2xl">{t('address.batch_revoke.title')}</h2>
            <div className="text-center mb-4 text-sm text-zinc-500 space-x-1">
              <span>
                {t('address.batch_revoke.revoked')}: {totalRevoked}
              </span>
              <span>|</span>
              <span>
                {t('address.batch_revoke.failed')}: {totalReverted}
              </span>
              <span>|</span>
              <span>
                {t('address.batch_revoke.total')}: {selectedAllowances.length}
              </span>
            </div>
            <div className="h-[46vh] w-full overflow-scroll whitespace-nowrap scrollbar-hide">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white z-50">
                  <tr>
                    <th className="py-2">#</th>
                    <th>{t('address.headers.asset')}</th>
                    <th>{t('address.headers.spender')}</th>
                    <th>{t('address.headers.status')}</th>
                    <th>{t('address.headers.transaction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAllowances.map((allowance, index) => (
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
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <TipSection midAmount={defaultAmount} nativeToken={nativeToken} onSelect={setTipAmount} />
            <ControlsWrapper
              chainId={selectedChainId}
              address={address}
              overrideDisabled={!tipAmount}
              disabledReason={t('address.tooltips.select_tip')}
            >
              {(disabled) => (
                <div>
                  <Button
                    style="primary"
                    size="md"
                    className="px-16"
                    onClick={revokeAndTip}
                    loading={isLoading}
                    disabled={disabled}
                  >
                    {isLoading ? t('common.buttons.revoking') : t('common.buttons.revoke')}
                  </Button>
                </div>
              )}
            </ControlsWrapper>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BatchRevokeModalWithButton;
