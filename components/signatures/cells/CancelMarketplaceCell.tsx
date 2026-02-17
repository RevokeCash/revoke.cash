import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import blocksDB from 'lib/databases/blocks';
import { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { type Marketplace, type OnCancel, type TransactionSubmitted, TransactionType } from 'lib/interfaces';
import { isNullish, waitForSubmittedTransactionConfirmation, waitForTransactionConfirmation } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { HOUR, SECOND } from 'lib/utils/time';
import { useTranslations } from 'next-intl';
import { useAsyncCallback } from 'react-async-hook';
import { usePublicClient, useWalletClient } from 'wagmi';

interface Props {
  marketplace: Marketplace;
  onCancel: OnCancel<Marketplace>;
}

const CancelMarketplaceCell = ({ marketplace, onCancel }: Props) => {
  const t = useTranslations();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient()!;
  const { address, selectedChainId } = useAddressPageContext();
  const handleTransaction = useHandleTransaction(selectedChainId);

  const sendCancelTransaction = async (): Promise<TransactionSubmitted> => {
    const hash = await marketplace?.cancelSignatures(walletClient!);

    analytics.track('Cancelled Marketplace Signatures', {
      chainId: selectedChainId,
      account: address,
      marketplace: marketplace.name,
    });

    const waitForConfirmation = async () => {
      // TODO: Deduplicate this with the CancelPermitCell
      const transactionReceipt = await waitForTransactionConfirmation(hash, publicClient);
      if (!transactionReceipt) return;
      const lastCancelled = await blocksDB.getTimeLog(publicClient, {
        ...transactionReceipt,
        blockNumber: Number(transactionReceipt.blockNumber),
      });

      await onCancel(marketplace, lastCancelled);

      return transactionReceipt;
    };

    return { hash, confirmation: waitForConfirmation() };
  };

  const cancel = async (): Promise<TransactionSubmitted | undefined> => {
    return handleTransaction(sendCancelTransaction(), TransactionType.OTHER);
  };

  const { execute, loading } = useAsyncCallback(() => waitForSubmittedTransactionConfirmation(cancel()));

  const recentlyCancelled =
    !isNullish(marketplace.lastCancelled?.timestamp) &&
    marketplace.lastCancelled.timestamp * SECOND > Date.now() - 24 * HOUR;

  return (
    <div className="flex justify-end w-32 mr-0 mx-auto">
      <ControlsWrapper
        chainId={selectedChainId}
        address={address}
        switchChainSize="sm"
        overrideDisabled={recentlyCancelled}
        disabledReason={t('signatures.marketplace.tooltips.recently_delisted')}
      >
        {(disabled) => (
          <div>
            <Button loading={loading} disabled={disabled} size="sm" style="secondary" onClick={execute}>
              {loading ? t('common.buttons.delisting') : t('common.buttons.bulk_delist')}
            </Button>
          </div>
        )}
      </ControlsWrapper>
    </div>
  );
};

export default CancelMarketplaceCell;
