import { ChainId } from '@revoke.cash/chains';
import SessionsDashboard from 'components/sessions/SessionsDashboard';
import type { NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

// Re-use metadata generation from the premium address page
export { generateMetadata } from '../page';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  addressOrName: string;
}

const PremiumAddressSessionsPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SessionsDashboard chainId={ChainId.Abstract} />;
};

export default PremiumAddressSessionsPage;
