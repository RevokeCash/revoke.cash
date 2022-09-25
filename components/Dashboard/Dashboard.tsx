import DashboardHeader from 'components/Header/DashboardHeader';
import React from 'react';
import { ToastContainer } from 'react-toastify';
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
        <ToastContainer
          position="top-right"
          icon={false}
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          progressStyle={{ backgroundColor: 'black' }}
        />
      </EthereumProvider>
    </SafeHydrate>
  );
}

export default Dashboard;
