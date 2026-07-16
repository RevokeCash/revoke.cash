import { getChainName, isSupportedChain } from '@revoke.cash/core/chains';
import { isNullish } from '@revoke.cash/core/utils';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import { getAddressAndDomainName } from '@revoke.cash/core/whois';
import AllowancesPageContent from 'components/allowances/dashboard/AllowancesPageContent';
import type { Metadata, NextPage } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}

interface Params {
  locale: string;
  addressOrName: string;
}

interface SearchParams {
  chainId?: string;
}

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  const { locale, addressOrName } = await params;
  const { chainId: searchChainId } = await searchParams;

  const t = await getTranslations({ locale });

  const { address, domainName } = await getAddressAndDomainName(addressOrName);
  const addressDisplay = domainName ?? shortenAddress(address)!;

  const searchChainIdNumber = Number(searchChainId || 1);
  const chainId = isSupportedChain(searchChainIdNumber) ? searchChainIdNumber : 1;
  const chainName = getChainName(chainId);

  const title = isNullish(searchChainId)
    ? t('address.meta.title', { addressDisplay })
    : t('address.meta.title_chain', { addressDisplay, chainName });

  return {
    title,
    description: t('common.meta.description', { chainName: chainName ?? 'Ethereum' }),
  };
};

const AddressPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AllowancesPageContent />;
};

export default AddressPage;
