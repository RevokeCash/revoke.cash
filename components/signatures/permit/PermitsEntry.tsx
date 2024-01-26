import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import AssetCell from 'components/allowances/dashboard/cells/AssetCell';
import { filterLastCancelled } from 'components/allowances/dashboard/cells/LastCancelledCell';
import Button from 'components/common/Button';
import { DUMMY_ADDRESS } from 'lib/constants';
import { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import { useAddressEvents, useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { AllowanceData, TransactionType } from 'lib/interfaces';
import { waitForTransactionConfirmation } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { permit } from 'lib/utils/permit';
import { isErc721Contract } from 'lib/utils/tokens';
import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';
import { usePublicClient, useWalletClient } from 'wagmi';

interface Props {
  token: AllowanceData;
}

const PermitsEntry = ({ token }: Props) => {
  const { t } = useTranslation();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address, selectedChainId } = useAddressPageContext();
  const handleTransaction = useHandleTransaction();

  const isPreviouslyCancelled = filterLastCancelled(useAddressEvents().events, token).alreadyCancelled;

  const { execute: onClick, loading } = useAsyncCallback(async () => {
    if (isErc721Contract(token.contract)) return;
    const transactionPromise = permit(walletClient, token.contract, DUMMY_ADDRESS, 0n);

    const hash = await handleTransaction(transactionPromise, TransactionType.OTHER);
    if (!hash) return;

    track('Cancelled Permit Signatures', { chainId: selectedChainId, account: address, token: token.contract.address });

    await waitForTransactionConfirmation(hash, publicClient);
  });

  return (
    <div className="px-4 border-t first:border-none border-zinc-300 dark:border-zinc-500">
      <div className="flex items-center justify-between w-full py-px">
        <AssetCell allowance={token} />
        <div className="flex justify-end">
          <ControlsWrapper chainId={selectedChainId} address={address} switchChainSize="sm">
            {(disabled) => (
              <div>
                <Button
                  loading={loading}
                  disabled={disabled || isPreviouslyCancelled}
                  size="sm"
                  style="secondary"
                  onClick={onClick}
                >
                  {loading ? t('common:buttons.cancelling') : t('common:buttons.cancel_signatures')}
                </Button>
              </div>
            )}
          </ControlsWrapper>
        </div>
      </div>
    </div>
  );
};

export default PermitsEntry;
