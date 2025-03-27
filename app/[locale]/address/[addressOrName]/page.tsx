import AllowanceDashboard from 'components/allowances/dashboard/AllowanceDashboard';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { isNullish } from 'lib/utils';
import { getChainName, isSupportedChain } from 'lib/utils/chains';
import { shortenAddress } from 'lib/utils/formatting';
import { getAddressAndDomainName } from 'lib/utils/whois';
import type { Metadata, NextPage } from 'next';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

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
  const addressDisplay = domainName ?? shortenAddress(address);

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

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={{ common: messages.common, address: messages.address }}>
      <AllowanceDashboard />
    </NextIntlClientProvider>
  );
};

export default AddressPage;
