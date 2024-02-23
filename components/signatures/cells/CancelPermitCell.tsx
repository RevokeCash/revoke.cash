import { DUMMY_ADDRESS } from 'lib/constants';
import { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { PermitTokenData, TransactionType } from 'lib/interfaces';
import { waitForTransactionConfirmation } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { permit } from 'lib/utils/permit';
import { isErc721Contract } from 'lib/utils/tokens';
import { usePublicClient, useWalletClient } from 'wagmi';
import CancelCell from './CancelCell';

interface Props {
  token: PermitTokenData;
}

const CancelPermitCell = ({ token }: Props) => {
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

    await waitForTransactionConfirmation(hash, publicClient);
  };

  return <CancelCell chainId={selectedChainId} address={address} lastCancelled={token.lastCancelled} cancel={cancel} />;
};

export default CancelPermitCell;
