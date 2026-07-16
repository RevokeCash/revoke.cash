import CoverageTab from 'components/account/tabs/CoverageTab';
import type { NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

const AccountCoveragePage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CoverageTab />;
};

export default AccountCoveragePage;
