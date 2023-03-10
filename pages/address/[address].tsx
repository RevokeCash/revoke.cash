import AddressHeader from 'components/address/AddressHeader';
import AllowanceTable from 'components/allowances/table/AllowanceTable';
import LogIn from 'components/common/LogIn';
import PublicLayout from 'layouts/PublicLayout';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import { defaultSEO } from 'lib/next-seo.config';
import { parseInputAddress } from 'lib/utils';
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

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={t('address:meta.title', { address: ssrDomainName ?? address })}
        description={t('address:meta.description')}
      />
      <PublicLayout>
        <AddressPageContextProvider address={address}>
          <AddressHeader />
          <LogIn showSpinner>
            <AllowanceTable />
          </LogIn>
        </AddressPageContextProvider>
      </PublicLayout>
    </>
  );
};

// TODO: ChainId query param
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
