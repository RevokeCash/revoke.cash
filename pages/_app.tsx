import { init, track } from '@amplitude/analytics-browser';
import Container from 'components/common/Container';
import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';
import { AppContextProvider } from 'lib/hooks/useAppContext';
import { EthereumProvider } from 'lib/hooks/useEthereum';
import { defaultSEO } from 'lib/next-seo.config';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect } from 'react';
import '../styles/index.css';

init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY);

const SafeHydrate = ({ children }) => {
  return <div suppressHydrationWarning>{typeof window === 'undefined' ? null : children}</div>;
};

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

      <SafeHydrate>
        <EthereumProvider>
          <AppContextProvider>
            <div className="flex flex-col min-h-screen">
              <div className="flex-none">
                <Container>
                  <Header />
                </Container>
              </div>

              {/* Main component, shoud grow indefinitely */}
              <div className="flex-grow">
                <Container>
                  <Component {...pageProps} />
                </Container>
              </div>

              <div>
                <Container>
                  <Footer />
                </Container>
              </div>
            </div>
          </AppContextProvider>
        </EthereumProvider>
      </SafeHydrate>

      <Script async defer src="https://scripts.simpleanalyticscdn.com/latest.js" />
    </>
  );
};

export default App;
