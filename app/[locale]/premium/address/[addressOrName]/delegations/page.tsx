import PremiumDelegationsDashboard from 'components/delegations/PremiumDelegationsDashboard';
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

const PremiumAddressDelegationsPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PremiumDelegationsDashboard />;
};

export default PremiumAddressDelegationsPage;
