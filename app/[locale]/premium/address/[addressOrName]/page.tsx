import PremiumAllowanceDashboard from 'components/allowances/dashboard/PremiumAllowanceDashboard';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
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

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale, addressOrName } = await params;

  const t = await getTranslations({ locale });

  const { address, domainName } = await getAddressAndDomainName(addressOrName);
  const addressDisplay = domainName ?? shortenAddress(address)!;

  const title = `${t('address.meta.title', { addressDisplay })} (Premium)`;

  return {
    title,
    description: t('common.meta.description', { chainName: 'All Chains' }),
  };
};

const PremiumAddressPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={{ common: messages.common, address: messages.address }}>
      <PremiumAllowanceDashboard />
    </NextIntlClientProvider>
  );
};

export default PremiumAddressPage;
