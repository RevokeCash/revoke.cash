'use client';

import WalletHealthSection from 'components/allowances/dashboard/wallet-health/WalletHealthSection';
import ChainSelect from 'components/common/select/ChainSelect';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useTranslations } from 'next-intl';
import AccountTypeLabel from './AccountTypeLabel';
import AddressDisplay from './AddressDisplay';
import AddressExternalLinks from './AddressExternalLinks';
import ConnectedLabel from './ConnectedLabel';
import PremiumBanner from './PremiumBanner';

const AddressHeader = () => {
  const t = useTranslations();
  const { address, domainName } = useAddress();
  const { selectedChainId, selectChain } = useAddressPageContext();

  return (
    <div className="flex flex-col md:flex-row gap-6 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="order-1 md:order-first flex flex-col gap-3 justify-between grow">
        <AddressDisplay
          address={address}
          domainName={domainName}
          className="text-3xl font-bold"
          copyButtonClassName="text-zinc-500 dark:text-zinc-400"
          withCopyButton
          withTooltip
        />
        <div className="flex items-center gap-2">
          <AccountTypeLabel address={address} />
          <ConnectedLabel address={address} />
        </div>
        <AddressExternalLinks address={address} chainId={selectedChainId} />
      </div>
      <div className="order-3 md:order-0 md:self-center">
        <WalletHealthSection />
      </div>
      <div className="order-2 md:order-last flex flex-col gap-3 shrink-0 md:self-center">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('address.viewing_on')}</span>
          <ChainSelect instanceId="address-chain-select" selected={selectedChainId} onSelect={selectChain} showNames />
        </div>
        <PremiumBanner />
      </div>
    </div>
  );
};

export default AddressHeader;
