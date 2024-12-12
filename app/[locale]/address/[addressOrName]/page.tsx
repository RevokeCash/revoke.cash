import AllowanceDashboard from 'components/allowances/dashboard/AllowanceDashboard';
import { isNullish } from 'lib/utils';
import { getChainName, isSupportedChain } from 'lib/utils/chains';
import { shortenAddress } from 'lib/utils/formatting';
import { getAddressAndDomainName } from 'lib/utils/whois';
import type { Metadata, NextPage } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: {
    locale: string;
    addressOrName: string;
  };
  searchParams: {
    chainId?: string;
  };
}

export const generateMetadata = async ({
  params: { locale, addressOrName },
  searchParams,
}: Props): Promise<Metadata> => {
  const t = await getTranslations({ locale });

  const { address, domainName } = await getAddressAndDomainName(addressOrName);
  const addressDisplay = domainName ?? shortenAddress(address);

  const chainIdFromSearchParams = Number(searchParams.chainId || 1);
  const chainId = isSupportedChain(chainIdFromSearchParams) ? chainIdFromSearchParams : 1;
  const chainName = getChainName(chainId);

  const title = isNullish(searchParams.chainId)
    ? t('address.meta.title', { addressDisplay })
    : t('address.meta.title_chain', { addressDisplay, chainName });

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
