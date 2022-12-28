import { init, track } from '@amplitude/analytics-browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EthereumProvider } from 'lib/hooks/useEthereum';
import type { AppProps } from 'next/app';
import Router, { useRouter } from 'next/router';
import Script from 'next/script';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/index.css';

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());
NProgress.configure({ showSpinner: false });

init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY, null, {
  trackingOptions: {
    ipAddress: false,
  },
});

const queryClient = new QueryClient();

const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    track('Viewed Page', { path: router.asPath });
  }, [router.isReady, router.asPath]);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <EthereumProvider>
          <Component {...pageProps} />
          <ToastContainer
            className="text-center"
            toastClassName="border border-black"
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
      </QueryClientProvider>
      <Script async defer src="https://scripts.simpleanalyticscdn.com/latest.js" />
    </>
  );
};

export default App;
