import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { Marketplace } from 'lib/interfaces';
import { waitForTransactionConfirmation } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { usePublicClient, useWalletClient } from 'wagmi';
import CancelCell from './CancelCell';

interface Props {
  marketplace: Marketplace;
}

const CancelMarketplaceCell = ({ marketplace }: Props) => {
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

    await waitForTransactionConfirmation(hash, publicClient);
  };

  return (
    <CancelCell chainId={selectedChainId} address={address} lastCancelled={marketplace.lastCancelled} cancel={cancel} />
  );
};

export default CancelMarketplaceCell;
