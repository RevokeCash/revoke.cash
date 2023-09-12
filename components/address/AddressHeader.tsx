import { useQuery } from '@tanstack/react-query';
import ChainSelect from 'components/common/ChainSelect';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import { usePublicClient } from 'wagmi';
import AddressDisplay from './AddressDisplay';
import AddressSocialShareButtons from './AddressSocialShareButtons';
import BalanceDisplay from './BalanceDisplay';
import ConnectedLabel from './ConnectedLabel';
import AddressNavigation from './navigation/AddressNavigation';
import { getNativeTokenPrice } from 'lib/price/utils';

const AddressHeader = () => {
  const isMounted = useMounted();
  const { address, selectedChainId, selectChain } = useAddressPageContext();
  const { domainName } = useNameLookup(address);
  const publicClient = usePublicClient({ chainId: selectedChainId });

  const { data: balance, isLoading: balanceIsLoading } = useQuery({
    queryKey: ['balance', address, publicClient.chain?.id],
    queryFn: () => publicClient.getBalance({ address }),
    enabled: !!address && !!publicClient.chain,
  });

  const { data: nativeAssetPrice, isLoading: nativeAssetPriceIsLoading } = useQuery({
    queryKey: ['nativeAssetPrice', publicClient.chain.id],
    queryFn: () => getNativeTokenPrice(publicClient.chain.id, publicClient),
    enabled: !!publicClient,
  });

  return (
    <div className="flex flex-col gap-2 mb-2 border border-black dark:border-white rounded-lg px-4 pt-3">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex flex-col gap-2 items-center sm:items-start">
          <AddressDisplay
            address={address}
            domainName={isMounted ? domainName : '\xa0'}
            className="text-2xl font-bold"
          />
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
              <BalanceDisplay
                balance={balance}
                price={nativeAssetPrice}
                isLoading={balanceIsLoading || nativeAssetPriceIsLoading}
              />
              <div className="leading-none">&bull;</div>
              <AddressDisplay address={address} withCopyButton withTooltip />
            </div>
            <ConnectedLabel address={address} />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <AddressSocialShareButtons address={address} />
          <ChainSelect instanceId="address-chain-select" selected={selectedChainId} onSelect={selectChain} />
        </div>
      </div>
      <AddressNavigation />
    </div>
  );
};

export default AddressHeader;
