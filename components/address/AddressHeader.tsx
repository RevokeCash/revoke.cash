'use client';

import ChainSelect from 'components/common/select/ChainSelect';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import AccountTypeLabel from './AccountTypeLabel';
import AddressDisplay from './AddressDisplay';
import AddressExternalLinks from './AddressExternalLinks';
import ConnectedLabel from './ConnectedLabel';
import AddressNavigation from './navigation/AddressNavigation';

const AddressHeader = () => {
  const { address, domainName, selectedChainId, selectChain } = useAddressPageContext();

  return (
    <div className="flex flex-col gap-2 mb-2 border border-black dark:border-white rounded-lg px-4 pt-3">
      <div className="flex justify-between items-center gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-between items-center">
            <div className="flex flex-col sm:flex-row gap-2">
              <AddressDisplay
                address={address}
                domainName={domainName}
                className="text-2xl font-bold"
                copyButtonClassName="text-zinc-500 dark:text-zinc-400"
                withCopyButton
                withTooltip
              />
              <div className="flex items-center gap-2">
                <AccountTypeLabel address={address} />
                <ConnectedLabel address={address} />
              </div>
            </div>
            <div className="sm:hidden">
              <ChainSelect instanceId="address-chain-select" selected={selectedChainId} onSelect={selectChain} />
            </div>
          </div>
          <AddressExternalLinks address={address} chainId={selectedChainId} />
        </div>
        <div className="hidden sm:block">
          <ChainSelect instanceId="address-chain-select" selected={selectedChainId} onSelect={selectChain} showNames />
        </div>
      </div>
      <AddressNavigation />
    </div>
  );
};

export default AddressHeader;
