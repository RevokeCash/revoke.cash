import blocksCache from '@revoke.cash/core/cache/blocks';
import { DUMMY_ADDRESS } from '@revoke.cash/core/constants';
import { isErc721Contract, type PermitTokenData } from '@revoke.cash/core/tokens';
import { type TransactionSubmitted, TransactionType } from '@revoke.cash/core/types';
import { isNullish } from '@revoke.cash/core/utils';
import { HOUR, SECOND } from '@revoke.cash/core/utils/time';
import { waitForSubmittedTransactionConfirmation, waitForTransactionConfirmation } from '@revoke.cash/core/wallet';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import { permit } from 'lib/allowances/permit';
import { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { OnCancel } from 'lib/types';
import analytics from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import { useAsyncCallback } from 'react-async-hook';
import { usePublicClient, useWalletClient } from 'wagmi';

interface Props {
  token: PermitTokenData;
  onCancel: OnCancel<PermitTokenData>;
}

const CancelPermitCell = ({ token, onCancel }: Props) => {
  const t = useTranslations();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient()!;
  const { address } = useAddress();
  const { selectedChainId } = useAddressPageContext();
  const handleTransaction = useHandleTransaction(selectedChainId);

  const { execute, loading } = useAsyncCallback(() => waitForSubmittedTransactionConfirmation(cancel()));

  const recentlyCancelled =
    !isNullish(token.lastCancelled?.timestamp) && token.lastCancelled.timestamp * SECOND > Date.now() - 24 * HOUR;

  const sendCancelTransaction = async (): Promise<TransactionSubmitted> => {
    if (isErc721Contract(token.contract)) throw new Error('Cannot cancel ERC721 tokens');
    const hash = await permit(walletClient!, token.contract, DUMMY_ADDRESS, 0n);

    analytics.track('Cancelled Permit Signatures', {
      chainId: selectedChainId,
      account: address,
      tokenAddress: token.contract.address,
    });

    const waitForConfirmation = async () => {
      // TODO: Deduplicate this with the CancelMarketplaceCell
      const transactionReceipt = await waitForTransactionConfirmation(hash, publicClient);
      if (!transactionReceipt) return;

      const lastCancelled = await blocksCache.getTimeLog(publicClient, {
        ...transactionReceipt,
        blockNumber: Number(transactionReceipt.blockNumber),
      });

      await onCancel(token, lastCancelled);
      return transactionReceipt;
    };

    return { hash, confirmation: waitForConfirmation() };
  };

  const cancel = async (): Promise<TransactionSubmitted | undefined> => {
    return handleTransaction(sendCancelTransaction(), TransactionType.OTHER);
  };

  return (
    <div className="flex justify-end w-32 mr-0 mx-auto">
      <ControlsWrapper
        chainId={selectedChainId}
        address={address}
        switchChainSize="sm"
        overrideDisabled={recentlyCancelled}
        disabledReason={t('signatures.permit.tooltips.recently_cancelled')}
      >
        {(disabled) => (
          <div>
            <Button loading={loading} disabled={disabled} size="sm" style="secondary" onClick={execute}>
              {loading ? t('common.buttons.cancelling') : t('common.buttons.cancel_signatures')}
            </Button>
          </div>
        )}
      </ControlsWrapper>
    </div>
  );
};

export default CancelPermitCell;
