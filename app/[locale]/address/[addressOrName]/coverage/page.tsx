import CoverageDashboard from 'components/coverage/CoverageDashboard';
import InfoPanel from 'components/coverage/InfoPanel';
import type { NextPage } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';

// Re-use metadata generation from the address page
export { generateMetadata } from '../page';

interface Props {
  params: {
    locale: string;
    addressOrName: string;
  };
}

const AddressCoveragePage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);

  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />
      <CoverageDashboard />
    </div>
  );
};

export default AddressCoveragePage;
