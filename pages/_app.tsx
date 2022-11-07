import { init, track } from '@amplitude/analytics-browser';
import Container from 'components/common/Container';
import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect } from 'react';
import '../styles/index.scss';

init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY);

const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    track('Viewed Page', { path: router.asPath });
  }, [router.isReady, router.asPath]);

  return (
    <>
      <Container>
        <div
        // style={{ flexShrink: '0' }}
        >
          <Header />
        </div>
        <div
        // style={{ flex: '1 0 auto', height: '100%' }}
        >
          <Component {...pageProps} />
        </div>
        <div
        // style={{ flexShrink: '0' }}
        >
          <Footer />
        </div>
      </Container>
      <Script async defer src="https://scripts.simpleanalyticscdn.com/latest.js" />
    </>
  );
};

export default App;
