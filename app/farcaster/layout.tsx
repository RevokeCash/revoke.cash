import { SpeedInsights } from '@vercel/speed-insights/next';
import Analytics from 'app/Analytics';
import ThemeScript from 'app/ThemeScript';
import ToastifyConfig from 'components/common/ToastifyConfig';
import TopLoader from 'components/common/TopLoader';
import FarcasterHeader from 'components/farcaster/FarcasterHeader';
import { EthereumProvider } from 'lib/hooks/ethereum/EthereumProvider';
import { QueryProvider } from 'lib/hooks/QueryProvider';
import { ColorThemeProvider } from 'lib/hooks/useColorTheme';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import '../../styles/index.css';
import { FarcasterEthereumProvider } from 'lib/hooks/ethereum/FarcasterEthereumProvider';

interface Props {
  children: ReactNode;
}

const FarcasterLayout = async ({ children }: Props) => {
  setRequestLocale('en');
  const messages = await getMessages({ locale: 'en' });

  return (
    <html lang="en">
      <head>
        <NextIntlClientProvider>
          <Analytics />
        </NextIntlClientProvider>
      </head>
      <body>
        <ThemeScript />
        <NextIntlClientProvider messages={{ common: messages.common, address: messages.address }}>
          <QueryProvider>
            <FarcasterEthereumProvider>
              <ColorThemeProvider>
                <div className="min-h-screen">
                  <FarcasterHeader />
                  <main className="w-full">{children}</main>
                </div>
                <ToastifyConfig />
              </ColorThemeProvider>
            </FarcasterEthereumProvider>
          </QueryProvider>
        </NextIntlClientProvider>
        <TopLoader />
        <SpeedInsights sampleRate={0.1} />
      </body>
    </html>
  );
};

export default FarcasterLayout;
