'use client';
import { useDelegations } from 'lib/hooks/ethereum/useDelegations';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import IncomingDelegationsTable from './IncomingDelegationsTable';
import InfoPanel from './InfoPanel';
import OutgoingDelegationsTable from './OutgoingDelegationsTable';

const DelegationsDashboard = () => {
  const t = useTranslations();
  const isMounted = useMounted();
  const { address, selectedChainId } = useAddressPageContext();

  // Get delegations data using our custom hook
  const { outgoingDelegations, incomingDelegations, isLoading, error, onRevoke } = useDelegations();

  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />

      {isMounted && (
        <div className="flex flex-col gap-2">
          <OutgoingDelegationsTable
            delegations={outgoingDelegations}
            isLoading={isLoading}
            error={error}
            onRevoke={onRevoke}
          />

          <IncomingDelegationsTable delegations={incomingDelegations} isLoading={isLoading} error={error} />
        </div>
      )}
    </div>
  );
};

export default DelegationsDashboard;
