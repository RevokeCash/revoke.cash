'use client';

import InfoPanel from './InfoPanel';
import SessionsTable from './SesssionsTable';

interface Props {
  chainId?: number;
}

const SessionsDashboard = ({ chainId }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />
      <SessionsTable chainId={chainId} />
    </div>
  );
};

export default SessionsDashboard;
