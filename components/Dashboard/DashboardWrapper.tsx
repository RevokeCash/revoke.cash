import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NoSSR from 'components/common/NoSSR';
import { AppContextProvider } from 'lib/hooks/useAppContext';
import { EthereumProvider } from 'lib/hooks/useEthereum';
import { ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
}

// We create a separate component because this breaks SSR (no window.ethereum on the server)
// We don't want to use NoSSR for all of _app because it breaks NextSeo
const DashboardWrapper = ({ children }: Props) => {
  return (
    <NoSSR>
      <QueryClientProvider client={queryClient}>
        <EthereumProvider>
          <AppContextProvider>
            {children}
            <ToastContainer
              className="text-center"
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
      </QueryClientProvider>
    </NoSSR>
  );
};

export default DashboardWrapper;
