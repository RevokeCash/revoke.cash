import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';
import { NextSeo } from 'next-seo';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import { Container } from 'react-bootstrap';
import { EthereumProvider } from 'utils/hooks/useEthereum';
import '../styles/index.scss';

const SafeHydrate = ({ children }) => {
  return <div suppressHydrationWarning>{typeof window === 'undefined' ? null : children}</div>;
};

const App = ({ Component, pageProps }: AppProps) => (
  <>
    <NextSeo
      title="Revoke.cash - Revoke your Ethereum token allowances"
      description="Protect your Ethereum token balances by revoking allowances and permissions you granted applications in the past."
      canonical="https://revoke.cash/"
      openGraph={{
        url: 'https://revoke.cash/',
        images: [
          {
            url: 'https://revoke.cash/assets/images/revoke-card.png',
            width: 1600,
            height: 900,
          },
        ],
        site_name: 'Revoke.cash',
        type: 'website',
      }}
      twitter={{
        handle: '@RoscoKalis',
        site: '@RevokeCash',
        cardType: 'summary_large_image',
      }}
      additionalLinkTags={[
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico',
        },
        { rel: 'apple-touch-icon', href: '/assets/images/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.json' },
      ]}
    />
    <SafeHydrate>
      <EthereumProvider>
        <Container
          fluid
          className="App"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            height: '100%',
            width: '100%',
            maxWidth: '1000px',
            margin: 'auto',
          }}
        >
          <div style={{ flexShrink: '0' }}>
            <Header />
          </div>
          <div style={{ flex: '1 0 auto', height: '100%' }}>
            <Component {...pageProps} />
          </div>
          <div style={{ flexShrink: '0' }}>
            <Footer />
          </div>
        </Container>
      </EthereumProvider>
    </SafeHydrate>
    <Script>{`window.sa_event=window.sa_event||function(){var a=[].slice.call(arguments);window.sa_event.q?window.sa_event.q.push(a):window.sa_event.q=[a]};`}</Script>
    <Script async defer src="https://scripts.simpleanalyticscdn.com/latest.js" />
  </>
);

export default App;
