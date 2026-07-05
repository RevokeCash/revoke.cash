import SubscriptionTab from 'components/account/tabs/SubscriptionTab';
import type { NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

const AccountSubscriptionPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SubscriptionTab />;
};

export default AccountSubscriptionPage;
