'use client';

import { useQuery } from '@tanstack/react-query';
import ChainSelect from 'components/common/select/ChainSelect';
import { useNativeTokenPrice } from 'lib/hooks/ethereum/useNativeTokenPrice';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { isNullish } from 'lib/utils';
import { isTestnetChain } from 'lib/utils/chains';
import { usePublicClient } from 'wagmi';
import AccountTypeLabel from './AccountTypeLabel';
import AddressDisplay from './AddressDisplay';
import AddressSocialShareButtons from './AddressSocialShareButtons';
import BalanceDisplay from './BalanceDisplay';
import ConnectedLabel from './ConnectedLabel';
import AddressNavigation from './navigation/AddressNavigation';

const AddressHeader = () => {
  const { address, domainName, selectedChainId, selectChain } = useAddressPageContext();
  const publicClient = usePublicClient({ chainId: selectedChainId })!;
  const isTestnet = isTestnetChain(selectedChainId);

  const { data: balance, isLoading: balanceIsLoading } = useQuery({
    queryKey: ['balance', address, publicClient.chain?.id],
    queryFn: () => publicClient.getBalance({ address: address! }),
    enabled: !isNullish(address) && !isNullish(publicClient.chain),
  });

  const { nativeTokenPrice, isLoading: nativeTokenPriceIsLoading } = useNativeTokenPrice(selectedChainId);

  return (
    <div className="flex flex-col gap-2 mb-2 border border-black dark:border-white rounded-lg px-4 pt-3">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex flex-col gap-2 items-center sm:items-start">
          <AddressDisplay address={address} domainName={domainName} className="text-2xl font-bold" />
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
              <BalanceDisplay
                balance={balance}
                price={isTestnet ? null : nativeTokenPrice}
                isLoading={balanceIsLoading || nativeTokenPriceIsLoading}
              />
              <div className="leading-none">&bull;</div>
              <AddressDisplay address={address} withCopyButton withTooltip />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AccountTypeLabel address={address} />
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
