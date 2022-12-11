import AllowanceTable from 'components/allowances/table/AllowanceTable';
import { displayGitcoinToast } from 'components/common/gitcoin-toast';
import PublicLayout from 'layouts/PublicLayout';
import { AddressContextProvider } from 'lib/hooks/useAddressContext';
import { defaultSEO } from 'lib/next-seo.config';
import { parseInputAddress } from 'lib/utils';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
import type { GetServerSideProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';
import { useEffect } from 'react';

interface Props {
  address: string;
  openSeaProxyAddress?: string;
}

const AddressPage: NextPage<Props> = ({ address, openSeaProxyAddress }) => {
  const { t } = useTranslation();

  useEffect(() => {
    displayGitcoinToast();
  }, []);

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <PublicLayout>
        <AddressContextProvider value={{ address, openSeaProxyAddress }}>
          <AllowanceTable />
        </AddressContextProvider>
      </PublicLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const address = await parseInputAddress(context.query!.address as string);
  const openSeaProxyAddress = await getOpenSeaProxyAddress(address);

  if (!address) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      address,
      openSeaProxyAddress,
    },
  };
};

export default AddressPage;
