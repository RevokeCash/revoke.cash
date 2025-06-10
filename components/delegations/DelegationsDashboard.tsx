'use client';
import { useDelegations } from 'lib/hooks/ethereum/delegations/useDelegations';
import IncomingDelegationsTable from './IncomingDelegationsTable';
import InfoPanel from './InfoPanel';
import OutgoingDelegationsTable from './OutgoingDelegationsTable';

const DelegationsDashboard = () => {
  const { outgoingDelegations, incomingDelegations, isLoading, error, onRevoke } = useDelegations();

  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />

      <div className="flex flex-col gap-2">
        <OutgoingDelegationsTable
          delegations={outgoingDelegations}
          isLoading={isLoading}
          error={error}
          onRevoke={onRevoke}
        />

        <IncomingDelegationsTable delegations={incomingDelegations} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
};

export default DelegationsDashboard;
