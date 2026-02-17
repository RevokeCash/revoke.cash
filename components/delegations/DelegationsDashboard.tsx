'use client';
import { useDelegations, useEip7702Delegations } from 'lib/hooks/ethereum/delegations/useDelegations';
import Eip7702DelegationsTable from './Eip7702DelegationsTable';
import IncomingDelegationsTable from './IncomingDelegationsTable';
import InfoPanel from './InfoPanel';
import OutgoingDelegationsTable from './OutgoingDelegationsTable';

const DelegationsDashboard = () => {
  const { outgoingDelegations, incomingDelegations, isLoading, error, onRevoke } = useDelegations();
  const {
    delegations: eip7702Delegations,
    isLoading: isEip7702DelegationsLoading,
    error: eip7702DelegationsError,
  } = useEip7702Delegations();

  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />

      <div className="flex flex-col gap-2">
        <Eip7702DelegationsTable
          delegations={eip7702Delegations}
          isLoading={isEip7702DelegationsLoading}
          error={eip7702DelegationsError}
        />
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
