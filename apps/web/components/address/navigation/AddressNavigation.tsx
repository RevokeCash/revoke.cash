'use client';

import { ChainId } from '@revoke.cash/chains';
import { isNullish } from '@revoke.cash/core/utils';
import { getAccountType } from '@revoke.cash/core/wallet';
import { useQuery } from '@tanstack/react-query';
import NavigationTab from 'components/common/NavigationTab';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';
import { usePublicClient } from 'wagmi';

const AddressNavigation = () => {
  const t = useTranslations();
  const { addressOrName } = useParams() as { addressOrName: string };
  const { address, isPremium } = useAddress();
  const publicClient = usePublicClient({ chainId: ChainId.Abstract });
  const path = usePathname();
  const context = useContext(AddressPageContext);
  const selectedChainId = context?.selectedChainId;

  const basePath = `/address/${addressOrName}`;
  const historyPath = `${basePath}/history`;
  const sessionsPath = `${basePath}/sessions`;
  const delegationsPath = `${basePath}/delegations`;
  const exploitsPath = `${basePath}/exploits`;

  const { data: abstractAccountType } = useQuery({
    queryKey: ['accountType', address, publicClient?.chain?.id],
    queryFn: () => getAccountType(address, publicClient!),
    enabled: !isNullish(address) && !isNullish(publicClient?.chain),
  });

  const hasCodeOnAbstract = !isNullish(abstractAccountType) && abstractAccountType !== 'EOA';
  const showSessionsTab =
    hasCodeOnAbstract && (isPremium || selectedChainId === ChainId.Abstract || path.endsWith(sessionsPath));

  return (
    <div className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full my-4 border-b border-zinc-200 dark:border-zinc-800">
      <nav className="flex gap-4">
        <NavigationTab name={t('address.navigation.allowances')} href={basePath} retainSearchParams={['chainId']} />
        <NavigationTab name={t('address.navigation.history')} href={historyPath} retainSearchParams={['chainId']} />
        {showSessionsTab && (
          <NavigationTab name={t('address.navigation.sessions')} href={sessionsPath} retainSearchParams={['chainId']} />
        )}
        <NavigationTab
          name={t('address.navigation.delegations')}
          href={delegationsPath}
          retainSearchParams={['chainId']}
        />
        {isPremium && (
          <NavigationTab name={t('address.navigation.exploits')} href={exploitsPath} retainSearchParams={['chainId']} />
        )}
      </nav>
    </div>
  );
};

export default AddressNavigation;
