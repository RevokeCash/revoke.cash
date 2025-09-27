'use client';

import { ChainId } from '@revoke.cash/chains';
import AddressForm from 'components/exploits/AddressForm';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import type { Address } from 'viem';
import PudgyChecker from './PudgyChecker';

const PudgyCheckerWrapper = () => {
  const t = useTranslations();
  const [address, setAddress] = useState<Address | undefined>();

  // TODO: Move AddressForm out of epxloits into some more generic component
  return (
    <Suspense>
      <AddressPageContextProvider address={address!} initialChainId={ChainId.EthereumMainnet}>
        <AddressForm onSubmit={setAddress} placeholder={t('pudgy.search.placeholder')} />
        <PudgyChecker />
      </AddressPageContextProvider>
    </Suspense>
  );
};

export default PudgyCheckerWrapper;
