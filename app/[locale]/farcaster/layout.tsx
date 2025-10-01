import { SpeedInsights } from '@vercel/speed-insights/next';
import Analytics from 'app/Analytics';
import ThemeScript from 'app/ThemeScript';
import ToastifyConfig from 'components/common/ToastifyConfig';
import TopLoader from 'components/common/TopLoader';
import { FarcasterEthereumProvider } from 'components/farcaster/FarcasterEthereumProvider';
import FarcasterHeader from 'components/farcaster/FarcasterHeader';
import { FarcasterProvider } from 'components/farcaster/FarcasterProvider';
import { QueryProvider } from 'lib/hooks/QueryProvider';
import { ColorThemeProvider } from 'lib/hooks/useColorTheme';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import '../../../styles/index.css';

interface Props {
  children: ReactNode;
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

const FarcasterLayout = async ({ children, params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        <Analytics />
      </head>
      <body>
        <ThemeScript />
        <NextIntlClientProvider messages={{ common: messages.common, address: messages.address }}>
          <QueryProvider>
            <FarcasterEthereumProvider>
              <ColorThemeProvider>
                <FarcasterProvider>
                  <div className="min-h-screen">
                    <FarcasterHeader />
                    <main className="w-full">{children}</main>
                  </div>
                </FarcasterProvider>
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
