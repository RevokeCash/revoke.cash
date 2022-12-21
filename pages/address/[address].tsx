import AddressHeader from 'components/address/AddressHeader';
import AllowanceTable from 'components/allowances/table/AllowanceTable';
import PublicLayout from 'layouts/PublicLayout';
import { AddressContextProvider } from 'lib/hooks/useAddressContext';
import { defaultSEO } from 'lib/next-seo.config';
import { parseInputAddress } from 'lib/utils';
import { getOpenSeaProxyAddress, lookupDomainName } from 'lib/utils/whois';
import type { GetServerSideProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  address: string;
  domainName?: string;
  openSeaProxyAddress?: string;
}

const AddressPage: NextPage<Props> = ({ address, domainName, openSeaProxyAddress }) => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <PublicLayout>
        <AddressContextProvider value={{ address, domainName, openSeaProxyAddress }}>
          <AddressHeader />
          <AllowanceTable />
        </AddressContextProvider>
      </PublicLayout>
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

  // Perform these requests in parallel to speed up the page load
  const [domainName, openSeaProxyAddress] = await Promise.all([
    address.toLowerCase() === addressParam ? lookupDomainName(address) : addressParam,
    getOpenSeaProxyAddress(address),
  ]);

  return {
    props: {
      address,
      domainName,
      openSeaProxyAddress,
    },
  };
};

export default AddressPage;
