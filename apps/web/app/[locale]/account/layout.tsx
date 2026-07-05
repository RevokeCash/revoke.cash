import ContentPageLayout from 'app/layouts/ContentPageLayout';
import AccountShell from 'components/account/AccountShell';
import { getServerAuthSession } from 'lib/api/auth';
import { AuthSessionProvider } from 'lib/hooks/auth/AuthSessionProvider';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import type { Metadata } from 'next';
import { getMessages, getTranslations } from 'next-intl/server';

interface Props {
  children: React.ReactNode;
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t('account.meta.title'),
    description: t('account.meta.description'),
  };
};

const AccountLayout = async ({ children, params }: Props) => {
  const { locale } = await params;
  const session = await getServerAuthSession();
  const messages = await getMessages({ locale });

  return (
    <ContentPageLayout searchBar>
      <AuthSessionProvider initialSession={session}>
        <NextIntlClientProvider messages={{ common: messages.common, account: messages.account }}>
          <AccountShell>{children}</AccountShell>
        </NextIntlClientProvider>
      </AuthSessionProvider>
    </ContentPageLayout>
  );
};

export default AccountLayout;
