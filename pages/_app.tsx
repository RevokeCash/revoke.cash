import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import { Container } from 'react-bootstrap';
import '../styles/index.scss';

const App = ({ Component, pageProps }: AppProps) => (
  <>
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
    <Script>{`window.sa_event=window.sa_event||function(){var a=[].slice.call(arguments);window.sa_event.q?window.sa_event.q.push(a):window.sa_event.q=[a]};`}</Script>
    <Script async defer src="https://scripts.simpleanalyticscdn.com/latest.js" />
  </>
);

export default App;
