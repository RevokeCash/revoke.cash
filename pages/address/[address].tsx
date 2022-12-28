import { useQuery } from '@tanstack/react-query';
import AddressHeader from 'components/address/AddressHeader';
import AllowanceTable from 'components/allowances/table/AllowanceTable';
import LogIn from 'components/common/LogIn';
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
  ssrDomainName?: string;
  openSeaProxyAddress?: string;
}

const AddressPage: NextPage<Props> = ({ address, ssrDomainName }) => {
  const { t } = useTranslation();

  // We do these calls client-side rather than server-side because it's safe to assume that this will finish
  // before getting all the allowances, and this will make the allowances page load faster.

  const { data: openSeaProxyAddress } = useQuery({
    queryKey: ['openSeaProxyAddress', address],
    queryFn: () => getOpenSeaProxyAddress(address),
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const { data: domainName } = useQuery({
    queryKey: ['domainName', address, ssrDomainName],
    queryFn: () => ssrDomainName ?? lookupDomainName(address),
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={t('address:meta.title', { address: ssrDomainName ?? address })}
        description={t('address:meta.description')}
      />
      <PublicLayout>
        <LogIn>
          <AddressContextProvider value={{ address, domainName, openSeaProxyAddress }}>
            <AddressHeader />
            <AllowanceTable />
          </AddressContextProvider>
        </LogIn>
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

  const ssrDomainName = address.toLowerCase() === addressParam ? null : addressParam;

  return {
    props: {
      address,
      ssrDomainName,
    },
  };
};

export default AddressPage;
