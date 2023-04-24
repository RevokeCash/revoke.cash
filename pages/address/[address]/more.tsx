import MoreDashboard from 'components/more/MoreDashboard';
import AddressPageLayout from 'layouts/AddressPageLayout';
import { defaultSEO } from 'lib/next-seo.config';
import { parseInputAddress } from 'lib/utils';
import type { GetServerSideProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  address: string;
  ssrDomainName?: string;
}

const AddressMorePage: NextPage<Props> = ({ address, ssrDomainName }) => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={t('address:meta.title', { address: ssrDomainName ?? address })}
        description={t('address:meta.description')}
      />
      <AddressPageLayout address={address}>
        <MoreDashboard />
      </AddressPageLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const addressParam = (context.query!.address as string).toLowerCase();
  const address = await parseInputAddress(addressParam);

  if (!address) {
    return {
      notFound: true,
    };
  }

  const ssrDomainName = address.toLowerCase() === addressParam ? null : addressParam;

  return {
    props: {
      address,
      ssrDomainName,
    },
  };
};

export default AddressMorePage;
