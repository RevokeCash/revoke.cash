import HistoryDashboard from 'components/history/HistoryDashboard';
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

const AddressHistoryPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HistoryDashboard />;
};

export default AddressHistoryPage;
