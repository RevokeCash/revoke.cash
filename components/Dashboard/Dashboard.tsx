import { EthereumProvider } from 'lib/hooks/useEthereum';
import { ToastContainer } from 'react-toastify';
import DashboardBody from './DashboardBody';
import DashboardHeader from './header/DashboardHeader';

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
