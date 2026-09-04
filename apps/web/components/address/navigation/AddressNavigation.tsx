'use client';

import { ChainId } from '@revoke.cash/core/chains/ids';
import { isNullish } from '@revoke.cash/core/utils';
import { getAccountType } from '@revoke.cash/core/wallet';
import { useQuery } from '@tanstack/react-query';
import NavigationTab from 'components/common/NavigationTab';
import NavigationTabs from 'components/common/NavigationTabs';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ComponentProps, useContext } from 'react';
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

  const hasCodeOnAbstract = !isNullish(abstractAccountType) && abstractAccountType !== 'eoa';
  const showSessionsTab =
    hasCodeOnAbstract && (isPremium || selectedChainId === ChainId.Abstract || path.endsWith(sessionsPath));

  return (
    <NavigationTabs className="my-4">
      <RetainedParamsNavigationTab name={t('address.navigation.allowances')} href={basePath} />
      <RetainedParamsNavigationTab name={t('address.navigation.history')} href={historyPath} />
      {showSessionsTab && <RetainedParamsNavigationTab name={t('address.navigation.sessions')} href={sessionsPath} />}
      <RetainedParamsNavigationTab name={t('address.navigation.delegations')} href={delegationsPath} />
      {isPremium && <RetainedParamsNavigationTab name={t('address.navigation.exploits')} href={exploitsPath} />}
    </NavigationTabs>
  );
};

export default AddressNavigation;

const RetainedParamsNavigationTab = ({ name, href }: ComponentProps<typeof NavigationTab>) => {
  return <NavigationTab name={name} href={href} retainSearchParams={['chainId', 'free']} />;
};
