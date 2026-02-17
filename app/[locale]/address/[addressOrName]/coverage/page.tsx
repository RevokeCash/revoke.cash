import CoverageDashboard from 'components/coverage/CoverageDashboard';
import InfoPanel from 'components/coverage/InfoPanel';
import type { NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

// Re-use metadata generation from the address page
export { generateMetadata } from '../page';

interface Props {
  params: Promise<{
    locale: string;
    addressOrName: string;
  }>;
}

const AddressCoveragePage: NextPage<Props> = async ({ params }) => {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);

  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />
      <CoverageDashboard />
    </div>
  );
};

export default AddressCoveragePage;
