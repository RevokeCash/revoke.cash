import { XMarkIcon } from '@heroicons/react/24/solid';
import { SpeedInsights } from '@vercel/speed-insights/next';
import HolyLoader from 'holy-loader';
import { QueryProvider } from 'lib/hooks/QueryProvider';
import { EthereumProvider } from 'lib/hooks/ethereum/EthereumProvider';
import { ColorThemeProvider } from 'lib/hooks/useColorTheme';
import { init, track } from 'lib/utils/analytics';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import React, { useEffect } from 'react';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as timeago from 'timeago.js';
import timeagoEs from 'timeago.js/lib/lang/es';
import timeagoJa from 'timeago.js/lib/lang/ja';
import timeagoRu from 'timeago.js/lib/lang/ru';
import timeagoZh from 'timeago.js/lib/lang/zh_CN';
import '../styles/index.css';

timeago.register('es', timeagoEs);
timeago.register('ja', timeagoJa);
timeago.register('ru', timeagoRu);
timeago.register('zh', timeagoZh);

// suppress useLayoutEffect warnings when running outside a browser
if (typeof window === 'undefined') React.useLayoutEffect = React.useEffect;

init();

const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    track('Viewed Page', { path: router.asPath });
  }, [router.isReady, router.asPath]);

  return (
    <>
      <QueryProvider>
        <EthereumProvider>
          <ColorThemeProvider>
            <Component {...pageProps} />
            <HolyLoader color="#000" height={2} />
            <ToastContainer
              className="text-center"
              toastClassName="border border-black bg-white text-zinc-900 dark:bg-black dark:border-white dark:text-zinc-100"
              progressClassName="bg-black dark:bg-white"
              closeButton={({ closeToast, ariaLabel }) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeToast(e);
                  }}
                  aria-label={ariaLabel}
                  className='"w-6 h-6 text-zinc-500 hover:text-black dark:hover:text-white shrink-0'
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              )}
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
            />
          </ColorThemeProvider>
        </EthereumProvider>
      </QueryProvider>
      <SpeedInsights sampleRate={0.1} />
      <Script async defer src="https://sa.revoke.cash/latest.js" />
    </>
  );
};

export default App;
