import PremiumAllowanceDashboard from 'components/allowances/dashboard/PremiumAllowanceDashboard';
import { shortenAddress } from 'lib/utils/formatting';
import { getAddressAndDomainName } from 'lib/utils/whois';
import type { Metadata, NextPage } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  addressOrName: string;
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale, addressOrName } = await params;

  const t = await getTranslations({ locale });

  const { address, domainName } = await getAddressAndDomainName(addressOrName);
  const addressDisplay = domainName ?? shortenAddress(address)!;

  const title = t('address.meta.title', { addressDisplay });

  return {
    title,
    description: t('common.meta.description', { chainName: 'Ethereum' }),
  };
};

const PremiumAddressPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PremiumAllowanceDashboard />;
};

export default PremiumAddressPage;
