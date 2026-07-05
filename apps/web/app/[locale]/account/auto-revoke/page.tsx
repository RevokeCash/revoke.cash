import AutoRevokeTab from 'components/account/tabs/AutoRevokeTab';
import type { NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

const AccountAutoRevokePage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AutoRevokeTab />;
};

export default AccountAutoRevokePage;
