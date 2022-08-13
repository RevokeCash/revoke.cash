import DashboardHeader from 'components/Header/DashboardHeader';
import React from 'react';
import { EthereumProvider } from 'utils/hooks/useEthereum';
import DashboardBody from './DashboardBody';

const SafeHydrate = ({ children }) => {
  return <div suppressHydrationWarning>{typeof window === 'undefined' ? null : children}</div>;
};

function Dashboard() {
  return (
    <SafeHydrate>
      <EthereumProvider>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <DashboardHeader />
          <DashboardBody />
        </div>
      </EthereumProvider>
    </SafeHydrate>
  );
}

export default Dashboard;
