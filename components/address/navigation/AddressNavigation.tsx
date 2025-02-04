'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import AddressNavigationTab from './AddressNavigationTab';

const AddressNavigation = () => {
  const { addressOrName } = useParams() as { addressOrName: string };
  const t = useTranslations();

  const basePath = `/address/${addressOrName}`;
  const signaturesPath = `${basePath}/signatures`;
  const coveragePath = `${basePath}/coverage`;
  return (
    <div className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full justify-center sm:justify-start">
      <nav className="flex gap-4">
        <AddressNavigationTab name={t('address.navigation.allowances')} href={basePath} />
        <AddressNavigationTab name={t('address.navigation.signatures')} href={signaturesPath} />
        <AddressNavigationTab name={t('address.navigation.coverage')} href={coveragePath} />
      </nav>
    </div>
  );
};

export default AddressNavigation;
