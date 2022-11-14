import { init, track } from '@amplitude/analytics-browser';
import { AppContextProvider } from 'lib/hooks/useAppContext';
import { EthereumProvider } from 'lib/hooks/useEthereum';
import { defaultSEO } from 'lib/next-seo.config';
import { NoSSR } from 'lib/utils/nossr';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect } from 'react';
import '../styles/index.css';

init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY);

const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!router.isReady) return;
    track('Viewed Page', { path: router.asPath });
  }, [router.isReady, router.asPath]);

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />

      <EthereumProvider>
        <AppContextProvider>
          <Component {...pageProps} />
        </AppContextProvider>
      </EthereumProvider>

      <Script async defer src="https://scripts.simpleanalyticscdn.com/latest.js" />
    </>
  );
};

export default NoSSR(App);
