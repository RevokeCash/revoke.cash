'use client';

import { ChainId } from '@revoke.cash/chains';
import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';
import AddressNavigationTab from './AddressNavigationTab';

interface Props {
  isPremium?: boolean;
}

const AddressNavigation = ({ isPremium }: Props) => {
  const { addressOrName } = useParams() as { addressOrName: string };
  const context = useContext(AddressPageContext);
  const selectedChainId = context?.selectedChainId;
  const path = usePathname();
  const t = useTranslations();

  const basePath = isPremium ? `/premium/address/${addressOrName}` : `/address/${addressOrName}`;
  const historyPath = `${basePath}/history`;
  const coveragePath = `${basePath}/coverage`;
  const sessionsPath = `${basePath}/sessions`;
  const delegationsPath = `${basePath}/delegations`;

  return (
    <div className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full">
      <nav className="flex gap-4">
        <AddressNavigationTab name={t('address.navigation.allowances')} href={basePath} />
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
