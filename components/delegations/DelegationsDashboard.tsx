'use client';
import { useDelegations, useEip7702Delegations } from 'lib/hooks/ethereum/delegations/useDelegations';
import DelegationsTable from './DelegationsTable';
import Eip7702DelegationsTable from './Eip7702DelegationsTable';
import InfoPanel from './InfoPanel';

const DelegationsDashboard = () => {
  const { delegations, isLoading, error, onRevoke } = useDelegations();
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
        <DelegationsTable delegations={delegations} isLoading={isLoading} error={error} onRevoke={onRevoke} />
      </div>
    </div>
  );
};

export default DelegationsDashboard;
