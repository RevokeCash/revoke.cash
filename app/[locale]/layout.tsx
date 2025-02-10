import { SpeedInsights } from '@vercel/speed-insights/next';
import Analytics from 'app/Analytics';
import ThemeScript from 'app/ThemeScript';
import ToastifyConfig from 'components/common/ToastifyConfig';
import TopLoader from 'components/common/TopLoader';
import Footer from 'components/footer/Footer';
import Header from 'components/header/Header';
import { QueryProvider } from 'lib/hooks/QueryProvider';
import { EthereumProvider } from 'lib/hooks/ethereum/EthereumProvider';
import { ColorThemeProvider } from 'lib/hooks/useColorTheme';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { locales } from 'lib/i18n/config';
import type { Metadata } from 'next';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import 'react-toastify/dist/ReactToastify.css';
import * as timeago from 'timeago.js';
import timeagoEs from 'timeago.js/lib/lang/es';
import timeagoJa from 'timeago.js/lib/lang/ja';
import timeagoRu from 'timeago.js/lib/lang/ru';
import timeagoZh from 'timeago.js/lib/lang/zh_CN';
import '../../styles/index.css';

timeago.register('es', timeagoEs);
timeago.register('ja', timeagoJa);
timeago.register('ru', timeagoRu);
timeago.register('zh', timeagoZh);

interface Props {
  children: React.ReactNode;
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const dynamicParams = false;

export const generateStaticParams = () => {
  return locales.map((locale) => ({ locale }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;

  const t = await getTranslations({ locale });

  return {
    metadataBase: new URL('https://revoke.cash'),
    title: {
      template: '%s | Revoke.cash',
      default: t('common.meta.title'),
    },
    description: t('common.meta.description', { chainName: 'Ethereum' }),
    applicationName: 'Revoke.cash',
    generator: 'Next.js',
  };
};

const MainLayout = async ({ children, params }: Props) => {
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
        <NextIntlClientProvider messages={{ common: messages.common }}>
          <QueryProvider>
            <EthereumProvider>
              <ColorThemeProvider>
                <div className="flex flex-col mx-auto min-h-screen">
                  <Header />
                  <main className="w-full grow">{children}</main>
                  <div className="flex flex-col justify-end">
                    <Footer />
                  </div>
                </div>
                <ToastifyConfig />
              </ColorThemeProvider>
            </EthereumProvider>
          </QueryProvider>
        </NextIntlClientProvider>
        <TopLoader />
        <SpeedInsights sampleRate={0.1} />
      </body>
    </html>
  );
};

export default MainLayout;
