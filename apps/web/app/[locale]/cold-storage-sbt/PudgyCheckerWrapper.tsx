'use client';

import { ChainId } from '@revoke.cash/core/chains/ids';
import NoticeBanner from 'components/common/NoticeBanner';
import AddressForm from 'components/exploits/AddressForm';
import { AddressIdentityContextProvider } from 'lib/hooks/page-context/AddressIdentityContext';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import type { Address } from 'viem';
import PudgyChecker from './PudgyChecker';

const PudgyCheckerWrapper = () => {
  const t = useTranslations();
  const [address, setAddress] = useState<Address | undefined>();

  // TODO: Move AddressForm out of exploits into some more generic component
  // The Pudgy Penguins SBT API is temporarily not working, so the form is disabled until it is back
  return (
    <Suspense>
      <AddressIdentityContextProvider address={address!}>
        <AddressPageContextProvider address={address!} initialChainId={ChainId.Ethereum}>
          <NoticeBanner style="warning">{t('pudgy.search.temporarily_disabled')}</NoticeBanner>
          <div inert className="opacity-60">
            <AddressForm onSubmit={setAddress} placeholder={t('pudgy.search.placeholder')} />
          </div>
          <PudgyChecker />
        </AddressPageContextProvider>
      </AddressIdentityContextProvider>
    </Suspense>
  );
};

export default PudgyCheckerWrapper;
