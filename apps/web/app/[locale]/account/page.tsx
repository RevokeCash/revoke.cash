import AccountDashboard from 'components/account/AccountDashboard';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import type { Metadata, NextPage } from 'next';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
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

const AccountPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={{ common: messages.common, account: messages.account }}>
      <AccountDashboard />
    </NextIntlClientProvider>
  );
};

export default AccountPage;
