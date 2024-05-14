import SignaturesDashboard from 'components/signatures/SignaturesDashboard';
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

const AddressSignaturesPage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);

  return <SignaturesDashboard />;
};

export default AddressSignaturesPage;
