import { DUMMY_ADDRESS } from 'lib/constants';
import { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { OnCancel, PermitTokenData, TransactionType } from 'lib/interfaces';
import { getLogTimestamp, waitForTransactionConfirmation } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { permit } from 'lib/utils/permit';
import { isErc721Contract } from 'lib/utils/tokens';
import { usePublicClient, useWalletClient } from 'wagmi';
import CancelCell from './CancelCell';

interface Props {
  token: PermitTokenData;
  onCancel: OnCancel<PermitTokenData>;
}

const CancelPermitCell = ({ token, onCancel }: Props) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address, selectedChainId } = useAddressPageContext();
  const handleTransaction = useHandleTransaction();

  const cancel = async () => {
    if (isErc721Contract(token.contract)) return;
    const transactionPromise = permit(walletClient, token.contract, DUMMY_ADDRESS, 0n);

    const hash = await handleTransaction(transactionPromise, TransactionType.OTHER);
    if (!hash) return;

    track('Cancelled Permit Signatures', { chainId: selectedChainId, account: address, token: token.contract.address });

    // TODO: Deduplicate this with the CancelMarketplaceCell
    const transactionReceipt = await waitForTransactionConfirmation(hash, publicClient);

    const lastCancelled = {
      transactionHash: hash,
      blockNumber: Number(transactionReceipt.blockNumber),
      timestamp: await getLogTimestamp(publicClient, { blockNumber: Number(transactionReceipt.blockNumber) }),
    };

    await onCancel(token, lastCancelled);
  };

  return <CancelCell chainId={selectedChainId} address={address} lastCancelled={token.lastCancelled} cancel={cancel} />;
};

export default CancelPermitCell;
