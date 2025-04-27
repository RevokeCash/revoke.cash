import DelegationsDashboard from 'components/delegations/DelegationsDashboard';
import type { NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

// Re-use metadata generation from the address page
export { generateMetadata } from '../page';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  addressOrName: string;
}

const AddressDelegationsPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DelegationsDashboard />;
};

export default AddressDelegationsPage;
