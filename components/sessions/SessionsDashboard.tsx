'use client';

import InfoPanel from './InfoPanel';
import SessionsTable from './SesssionsTable';

const SessionsDashboard = () => {
  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />
      <SessionsTable />
    </div>
  );
};

export default SessionsDashboard;
