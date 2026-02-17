'use client';

import AddressForm from 'components/exploits/AddressForm';
import MarketplaceTable from 'components/signatures/marketplace/MarketplaceTable';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Address } from 'viem';

interface Props {
  chainId: number;
}

const MarketplaceBulkDelisterChecker = ({ chainId }: Props) => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [address, setAddress] = useState<Address | undefined>(
    (searchParams.get('address') ?? undefined) as Address | undefined,
  );

  return (
    <AddressPageContextProvider address={address!} initialChainId={chainId} queryParams={['address']}>
      <div className="flex flex-col gap-2 w-full max-w-3xl">
        <AddressForm address={address} onSubmit={setAddress} placeholder={t('common.nav.search')} />
        {address && <MarketplaceTable />}
      </div>
    </AddressPageContextProvider>
  );
};

export default MarketplaceBulkDelisterChecker;
