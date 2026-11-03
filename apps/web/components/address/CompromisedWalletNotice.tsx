'use client';

import { getChainName } from '@revoke.cash/core/chains';
import { getEip7702DelegatedAddress } from '@revoke.cash/core/eip7702';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import Button from 'components/common/Button';
import NoticeBanner from 'components/common/NoticeBanner';
import { getSpenderDataQuery } from 'lib/hooks/ethereum/useSpenderData';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';

interface Props {
  address: Address;
  chainId: number;
}

// Sweeper bots delegate a compromised wallet (EIP7702) to a contract that forwards all incoming funds to the attacker.
// Whois labels these contracts as "Scam Delegate" with a blocklist risk factor.
const CompromisedWalletNotice = ({ address, chainId }: Props) => {
  const t = useTranslations();
  const publicClient = usePublicClient({ chainId });

  // Same query keys as Eip7702DelegationDetails and AddressCellWithRiskData, so the delegation tooltip reuses the data
  const { data: delegatedAddress } = useQuery({
    queryKey: ['delegatedAddress', address, publicClient?.chain?.id],
    queryFn: () => getEip7702DelegatedAddress(address, publicClient!),
    enabled: !isNullish(publicClient?.chain),
  });

  const { data: delegateData } = useQuery({
    ...getSpenderDataQuery(chainId, delegatedAddress!),
    enabled: !isNullish(delegatedAddress),
  });

  const isScamDelegate = delegateData?.riskFactors?.some((riskFactor) => riskFactor.type === 'blocklist');
  if (!isScamDelegate) return null;

  return (
    <NoticeBanner
      style="danger"
      action={
        <Button style="secondary" size="sm" href="/learn/security/seed-phrase-compromise" router>
          {t('common.buttons.learn_more')}
        </Button>
      }
    >
      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t('address.compromised_notice.title')}</span>{' '}
      {t('address.compromised_notice.description', { chain: getChainName(chainId) })}
    </NoticeBanner>
  );
};

export default CompromisedWalletNotice;
