import { SpeedInsights } from '@vercel/speed-insights/next';
import Analytics from 'app/Analytics';
import TopLoader from 'components/common/TopLoader';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import '../../styles/index.css';

interface Props {
  children: ReactNode;
}

const EmbedRootLayout = async ({ children }: Props) => {
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
        <EmbedThemeScript />
        <NextIntlClientProvider messages={{ common: messages.common, address: messages.address }}>
          {children}
        </NextIntlClientProvider>
        <TopLoader />
        <SpeedInsights sampleRate={0.1} />
      </body>
    </html>
  );
};

export default EmbedRootLayout;

// Embed-specific theme script that always follows system preference (uses no localStorage, so it doesn't affect main site)
const EmbedThemeScript = () => {
  const themeScript = `
    (function() {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      }
    })()
  `;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: the theme script only works with dangerouslySetInnerHTML
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};
