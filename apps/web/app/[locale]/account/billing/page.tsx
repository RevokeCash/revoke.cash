import BillingTab from 'components/account/tabs/BillingTab';
import type { NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

const AccountBillingPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BillingTab />;
};

export default AccountBillingPage;
