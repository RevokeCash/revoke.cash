import { AppContextProvider } from 'lib/hooks/useAppContext';
import { EthereumProvider } from 'lib/hooks/useEthereum';
import { ToastContainer } from 'react-toastify';
import Dashboard from './Dashboard';

const SafeHydrate = ({ children }) => {
  return <div suppressHydrationWarning>{typeof window === 'undefined' ? null : children}</div>;
};

function DashboardWrapper() {
  return (
    <SafeHydrate>
      <EthereumProvider>
        <AppContextProvider>
          <Dashboard />
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
        </AppContextProvider>
      </EthereumProvider>
    </SafeHydrate>
  );
}

export default DashboardWrapper;
