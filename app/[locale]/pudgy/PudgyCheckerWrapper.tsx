'use client';

import { ChainId } from '@revoke.cash/chains';
import ConnectButton from 'components/header/ConnectButton';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { useAccount } from 'wagmi';
import PudgyChecker from './PudgyChecker';

const PudgyCheckerWrapper = () => {
  const { address } = useAccount();
  const [clickedCheck, setClickedCheck] = useState(false);
  const t = useTranslations();

  if (!clickedCheck || !address) {
    return <ConnectButton text={t('pudgy.buttons.check_eligibility')} onClick={() => setClickedCheck(true)} />;
  }

  return (
    <Suspense>
      <AddressPageContextProvider address={address!} initialChainId={ChainId.EthereumMainnet}>
        <PudgyChecker />
      </AddressPageContextProvider>
    </Suspense>
  );
};

export default PudgyCheckerWrapper;
