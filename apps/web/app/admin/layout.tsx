import ThemeScript from 'app/ThemeScript';
import AdminShell from 'components/admin/AdminShell';
import ToastifyConfig from 'components/common/ToastifyConfig';
import TopLoader from 'components/common/TopLoader';
import { getServerAuthSession } from 'lib/api/auth';
import { AuthSessionProvider } from 'lib/hooks/auth/AuthSessionProvider';
import { EthereumProvider } from 'lib/hooks/ethereum/EthereumProvider';
import { QueryProvider } from 'lib/hooks/QueryProvider';
import { ColorThemeProvider } from 'lib/hooks/useColorTheme';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import '../../styles/index.css';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

const outfitRevoke = localFont({
  src: '../../public/assets/fonts/Outfit-Revoke-SemiBold.ttf',
  variable: '--font-heading',
  display: 'swap',
  weight: '600',
});
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

interface Props {
  children: ReactNode;
}

const AdminLayout = async ({ children }: Props) => {
  setRequestLocale('en');
  const session = await getServerAuthSession();
  const messages = await getMessages({ locale: 'en' });

  // suppressHydrationWarning is needed because ThemeScript adds the 'dark' class to <html> before hydration
  return (
    <html lang="en" className={`${outfitRevoke.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeScript />
        <NextIntlClientProvider
          messages={{ common: messages.common, account: messages.account, address: messages.address }}
        >
          <QueryProvider>
            <AuthSessionProvider initialSession={session}>
              <EthereumProvider>
                <ColorThemeProvider>
                  <main className="w-full max-w-7xl mx-auto min-h-screen px-4 lg:px-8">
                    <AdminShell>{children}</AdminShell>
                  </main>
                  <ToastifyConfig />
                </ColorThemeProvider>
              </EthereumProvider>
            </AuthSessionProvider>
          </QueryProvider>
        </NextIntlClientProvider>
        <TopLoader />
      </body>
    </html>
  );
};

export default AdminLayout;
