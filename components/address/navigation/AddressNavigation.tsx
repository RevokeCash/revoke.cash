'use client';

import { ChainId } from '@revoke.cash/chains';
import { useQuery } from '@tanstack/react-query';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { getAccountType, isNullish } from 'lib/utils';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';
import { usePublicClient } from 'wagmi';
import AddressNavigationTab from './AddressNavigationTab';

interface Props {
  isPremium?: boolean;
}

const AddressNavigation = ({ isPremium }: Props) => {
  const t = useTranslations();
  const { addressOrName } = useParams() as { addressOrName: string };
  const { address } = useAddress();
  const publicClient = usePublicClient({ chainId: ChainId.Abstract });
  const path = usePathname();
  const context = useContext(AddressPageContext);
  const selectedChainId = context?.selectedChainId;

  const basePath = isPremium ? `/premium/address/${addressOrName}` : `/address/${addressOrName}`;
  const historyPath = `${basePath}/history`;
  const coveragePath = `${basePath}/coverage`;
  const sessionsPath = `${basePath}/sessions`;
  const delegationsPath = `${basePath}/delegations`;

  const { data: abstractAccountType } = useQuery({
    queryKey: ['accountType', address, publicClient?.chain?.id],
    queryFn: () => getAccountType(address, publicClient!),
    enabled: !isNullish(address) && !isNullish(publicClient?.chain),
  });

  const hasCodeOnAbstract = !isNullish(abstractAccountType) && abstractAccountType !== 'EOA';
  const showSessionsTab =
    hasCodeOnAbstract && (isPremium || selectedChainId === ChainId.Abstract || path.endsWith(sessionsPath));

  return (
    <div className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full my-4 border-b border-black dark:border-white">
      <nav className="flex gap-4">
        <AddressNavigationTab name={t('address.navigation.allowances')} href={basePath} />
        <AddressNavigationTab name={t('address.navigation.history')} href={historyPath} />
        {showSessionsTab && <AddressNavigationTab name={t('address.navigation.sessions')} href={sessionsPath} />}
        <AddressNavigationTab name={t('address.navigation.delegations')} href={delegationsPath} />
        <AddressNavigationTab name={t('address.navigation.coverage')} href={coveragePath} />
      </nav>
    </div>
  );
};

export default AddressNavigation;
