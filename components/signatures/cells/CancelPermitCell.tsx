import { DUMMY_ADDRESS } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { type OnCancel, type TransactionSubmitted, TransactionType } from 'lib/interfaces';
import { waitForTransactionConfirmation } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { permit } from 'lib/utils/permit';
import { type PermitTokenData, isErc721Contract } from 'lib/utils/tokens';
import { usePublicClient, useWalletClient } from 'wagmi';
import CancelCell from './CancelCell';

interface Props {
  token: PermitTokenData;
  onCancel: OnCancel<PermitTokenData>;
}

const CancelPermitCell = ({ token, onCancel }: Props) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient()!;
  const { address, selectedChainId } = useAddressPageContext();
  const handleTransaction = useHandleTransaction(selectedChainId);

  const sendCancelTransaction = async (): Promise<TransactionSubmitted> => {
    if (isErc721Contract(token.contract)) throw new Error('Cannot cancel ERC721 tokens');
    const hash = await permit(walletClient!, token.contract, DUMMY_ADDRESS, 0n);

    track('Cancelled Permit Signatures', { chainId: selectedChainId, account: address, token: token.contract.address });

    const waitForConfirmation = async () => {
      // TODO: Deduplicate this with the CancelMarketplaceCell
      const transactionReceipt = await waitForTransactionConfirmation(hash, publicClient);
      if (!transactionReceipt) return;

      const lastCancelled = await blocksDB.getTimeLog(publicClient, {
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

  return <CancelCell chainId={selectedChainId} address={address} lastCancelled={token.lastCancelled} cancel={cancel} />;
};

export default CancelPermitCell;
