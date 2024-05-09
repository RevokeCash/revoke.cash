'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import AddressNavigationTab from './AddressNavigationTab';

const AddressNavigation = () => {
  const { addressOrName } = useParams();
  const t = useTranslations();

  const basePath = `/address/${addressOrName}`;
  const signaturesPath = `${basePath}/signatures`;

  return (
    <div className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full justify-center sm:justify-start">
      <Suspense>
        <nav className="flex gap-4">
          <AddressNavigationTab name={t('address.navigation.allowances')} href={basePath} />
          <AddressNavigationTab name={t('address.navigation.signatures')} href={signaturesPath} />
        </nav>
      </Suspense>
    </div>
  );
};

export default AddressNavigation;
