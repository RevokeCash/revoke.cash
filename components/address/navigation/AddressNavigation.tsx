'use client';

import { ChainId } from '@revoke.cash/chains';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useTranslations } from 'next-intl';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AddressNavigationTab from './AddressNavigationTab';

const COVERAGE_VIEWED_KEY = 'coverage-tab-viewed';

const AddressNavigation = () => {
  const { addressOrName } = useParams() as { addressOrName: string };
  const { selectedChainId } = useAddressPageContext();
  const path = usePathname();
  const t = useTranslations();
  const [showNew, setShowNew] = useState(false);

  const basePath = `/address/${addressOrName}`;
  const signaturesPath = `${basePath}/signatures`;
  const coveragePath = `${basePath}/coverage`;
  const sessionsPath = `${basePath}/sessions`;

  useEffect(() => {
    // Check if user has previously viewed the coverage tab
    const hasViewedCoverage = localStorage.getItem(COVERAGE_VIEWED_KEY);
    if (hasViewedCoverage) {
      setShowNew(false);
    } else {
      setShowNew(true);
    }
  }, []);

  useEffect(() => {
    // If user is on coverage path, mark it as viewed
    if (path.endsWith(coveragePath)) {
      localStorage.setItem(COVERAGE_VIEWED_KEY, 'true');
      setShowNew(false);
    }
  }, [path, coveragePath]);

  return (
    <div className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full justify-center sm:justify-start">
      <nav className="flex gap-4">
        <AddressNavigationTab name={t('address.navigation.allowances')} href={basePath} />
        <AddressNavigationTab name={t('address.navigation.signatures')} href={signaturesPath} />
        {(selectedChainId === ChainId.Abstract || path.endsWith(sessionsPath)) && (
          <AddressNavigationTab name={t('address.navigation.sessions')} href={sessionsPath} />
        )}
        <div className="relative">
          <AddressNavigationTab name={t('address.navigation.coverage')} href={coveragePath} />
          {showNew && (
            <div className="absolute top-0 -right-8 bg-blue-500 text-white text-[10px] px-1 py-0.5 rounded-full animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_6px_rgba(59,130,246,0.5)]">
              NEW
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default AddressNavigation;
