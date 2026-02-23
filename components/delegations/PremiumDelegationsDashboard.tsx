'use client';

import EmptyChainsSection from 'components/common/EmptyChainsSection';
import { useEip7702Delegations } from 'lib/hooks/ethereum/delegations/useDelegations';
import { usePremiumDelegations } from 'lib/hooks/ethereum/delegations/usePremiumDelegations';
import { useTranslations } from 'next-intl';
import ChainDelegationSection from './ChainDelegationSection';
import Eip7702DelegationsTable from './Eip7702DelegationsTable';
import InfoPanel from './InfoPanel';

const PremiumDelegationsDashboard = () => {
  const t = useTranslations();
  const { chainData, onRevoke } = usePremiumDelegations();
  const {
    delegations: eip7702Delegations,
    isLoading: isEip7702DelegationsLoading,
    error: eip7702DelegationsError,
  } = useEip7702Delegations();

  const chainsWithContent = chainData.filter(
    (chain) => chain.status === 'loading' || chain.status === 'error' || chain.delegations.length > 0,
  );
  const emptyChains = chainData.filter((chain) => chain.status === 'success' && chain.delegations.length === 0);

  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />

      <div className="flex flex-col gap-2">
        <Eip7702DelegationsTable
          delegations={eip7702Delegations}
          isLoading={isEip7702DelegationsLoading}
          error={eip7702DelegationsError}
        />
        {chainsWithContent.map((chain) => (
          <ChainDelegationSection key={chain.chainId} chainData={chain} onRevoke={onRevoke} />
        ))}
        <EmptyChainsSection
          emptyChains={emptyChains}
          description={t('address.delegations.empty_chains_count', { count: emptyChains.length })}
        />
      </div>
    </div>
  );
};

export default PremiumDelegationsDashboard;
