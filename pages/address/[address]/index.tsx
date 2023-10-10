import AllowanceDashboard from 'components/allowances/dashboard/AllowanceDashboard';
import AddressPageLayout from 'layouts/AddressPageLayout';
import { useAddressPageTitle } from 'lib/hooks/page-context/useAddressPageTitle';
import { defaultSEO } from 'lib/next-seo.config';
import { parseInputAddress } from 'lib/utils/whois';
import type { GetServerSideProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';
import { Address } from 'viem';

interface Props {
  address: Address;
  ssrDomainName?: string;
}

const AddressPage: NextPage<Props> = ({ address, ssrDomainName }) => {
  const { t } = useTranslation();
  const title = useAddressPageTitle(ssrDomainName, address);

  return (
    <>
      <NextSeo {...defaultSEO} title={title} description={t('common:meta.description', { chainName: 'Ethereum' })} />
      <AddressPageLayout address={address}>
        <AllowanceDashboard />
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

export default AddressPage;
