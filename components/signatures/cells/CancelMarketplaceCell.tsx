import blocksDB from 'lib/databases/blocks';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { Marketplace, OnCancel } from 'lib/interfaces';
import { waitForTransactionConfirmation } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { usePublicClient, useWalletClient } from 'wagmi';
import CancelCell from './CancelCell';

interface Props {
  marketplace: Marketplace;
  onCancel: OnCancel<Marketplace>;
}

const CancelMarketplaceCell = ({ marketplace, onCancel }: Props) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address, selectedChainId } = useAddressPageContext();

  const cancel = async () => {
    const hash = await marketplace?.cancelSignatures(walletClient);
    track('Cancelled Marketplace Signatures', {
      chainId: selectedChainId,
      account: address,
      marketplace: marketplace.name,
    });

    // TODO: Deduplicate this with the CancelPermitCell
    const transactionReceipt = await waitForTransactionConfirmation(hash, publicClient);
    const lastCancelled = await blocksDB.getTimeLog(publicClient, {
      ...transactionReceipt,
      blockNumber: Number(transactionReceipt.blockNumber),
    });

    await onCancel(marketplace, lastCancelled);
  };

  return (
    <CancelCell chainId={selectedChainId} address={address} lastCancelled={marketplace.lastCancelled} cancel={cancel} />
  );
};

export default CancelMarketplaceCell;
