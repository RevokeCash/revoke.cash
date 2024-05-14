import AllowanceDashboard from 'components/allowances/dashboard/AllowanceDashboard';
import { getChainName } from 'lib/utils/chains';
import { shortenAddress } from 'lib/utils/formatting';
import { getAddressAndDomainName } from 'lib/utils/whois';
import type { Metadata, NextPage } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: {
    locale: string;
    addressOrName: string;
  };
}

export const generateMetadata = async ({ params: { locale, addressOrName }, searchParams }): Promise<Metadata> => {
  const t = await getTranslations({ locale });

  const { address, domainName } = await getAddressAndDomainName(addressOrName);
  const addressDisplay = domainName ?? shortenAddress(address);

  const chainName = getChainName(Number(searchParams.chainId || 1));

  const title = !!searchParams.chainId
    ? t('address.meta.title_chain', { addressDisplay, chainName })
    : t('address.meta.title', { addressDisplay });

  return {
    title,
    description: t('common.meta.description', { chainName: chainName ?? 'Ethereum' }),
  };
};

const AddressPage: NextPage<Props> = async ({ params }) => {
  unstable_setRequestLocale(params.locale);

  return <AllowanceDashboard />;
};

export default AddressPage;
