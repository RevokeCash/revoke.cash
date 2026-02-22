'use client';

import { ChainId } from '@revoke.cash/chains';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import AddressDisplay from './AddressDisplay';
import AddressExternalLinks from './AddressExternalLinks';
import ConnectedLabel from './ConnectedLabel';
import AddressNavigation from './navigation/AddressNavigation';

const PremiumAddressHeader = () => {
  const { address, domainName } = useAddress();

  return (
    <div className="w-full flex flex-col items-center sm:items-start gap-2 mb-2 border border-black dark:border-white rounded-lg px-4 pt-3">
      <div className="flex flex-row items-center gap-2">
        <AddressDisplay
          address={address}
          domainName={domainName}
          className="text-2xl font-bold"
          copyButtonClassName="text-zinc-500 dark:text-zinc-400"
          withCopyButton
          withTooltip
        />
        <ConnectedLabel address={address} />
      </div>
      <AddressExternalLinks address={address} chainId={ChainId.EthereumMainnet} />
      <AddressNavigation isPremium />
    </div>
  );
};

export default PremiumAddressHeader;
