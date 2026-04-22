'use client';

import { ChainId } from '@revoke.cash/chains';
import WalletHealthSection from 'components/allowances/dashboard/wallet-health/WalletHealthSection';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import AddressDisplay from './AddressDisplay';
import AddressExternalLinks from './AddressExternalLinks';
import ConnectedLabel from './ConnectedLabel';
import PremiumBadge from './PremiumBadge';

const PremiumAddressHeader = () => {
  const { address, domainName } = useAddress();

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-6 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <AddressDisplay
            address={address}
            domainName={domainName}
            className="text-3xl font-bold"
            copyButtonClassName="text-zinc-500 dark:text-zinc-400"
            withCopyButton
            withTooltip
          />
          <div className="flex items-center gap-2">
            <ConnectedLabel address={address} />
            <PremiumBadge />
          </div>
        </div>
        <AddressExternalLinks address={address} chainId={ChainId.EthereumMainnet} />
      </div>
      <WalletHealthSection isPremium />
    </div>
  );
};

export default PremiumAddressHeader;
