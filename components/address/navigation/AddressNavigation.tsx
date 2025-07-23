'use client';

import { ChainId } from '@revoke.cash/chains';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useTranslations } from 'next-intl';
import { useParams, usePathname } from 'next/navigation';
import AddressNavigationTab from './AddressNavigationTab';

const AddressNavigation = () => {
  const { addressOrName } = useParams() as { addressOrName: string };
  const { selectedChainId } = useAddressPageContext();
  const path = usePathname();
  const t = useTranslations();

  const basePath = `/address/${addressOrName}`;
  const signaturesPath = `${basePath}/signatures`;
  const historyPath = `${basePath}/history`;
  const coveragePath = `${basePath}/coverage`;
  const sessionsPath = `${basePath}/sessions`;
  const delegationsPath = `${basePath}/delegations`;

  return (
    <div className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full justify-center sm:justify-start">
      <nav className="flex gap-4">
        <AddressNavigationTab name={t('address.navigation.allowances')} href={basePath} />
        <AddressNavigationTab name={t('address.navigation.signatures')} href={signaturesPath} />
        <AddressNavigationTab name={t('address.navigation.history')} href={historyPath} />
        {(selectedChainId === ChainId.Abstract || path.endsWith(sessionsPath)) && (
          <AddressNavigationTab name={t('address.navigation.sessions')} href={sessionsPath} />
        )}
        <AddressNavigationTab name={t('address.navigation.delegations')} href={delegationsPath} />
        <AddressNavigationTab name={t('address.navigation.coverage')} href={coveragePath} />
      </nav>
    </div>
  );
};

export default AddressNavigation;
