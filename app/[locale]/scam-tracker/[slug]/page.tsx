// page.tsx (Server Component)
import ChainDescription from 'components/common/ChainDescription';
import ChainLogo from 'components/common/ChainLogo';
import Prose from 'components/common/Prose';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { locales } from 'lib/i18n/config';
import { SUPPORTED_CHAINS, getChainIdFromSlug, getChainName, getChainSlug } from 'lib/utils/chains';
import { getOpenGraphImageUrl } from 'lib/utils/og';
import type { Metadata, NextPage } from 'next';
import { useMessages, useTranslations } from 'next-intl';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import ScamTrackerContent from './ScamTrackerContent';

interface Props {
  params: {
    locale: string;
    slug: string;
  };
}

export const generateStaticParams = () => {
  const slugs = SUPPORTED_CHAINS.map(getChainSlug);
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
};

export const generateMetadata = async ({ params: { locale, slug } }: Props): Promise<Metadata> => {
  const t = await getTranslations({ locale });
  const chainId = getChainIdFromSlug(slug);
  const chainName = getChainName(chainId);

  return {
    title: t('scam_tracker.meta.title', { chainName }),
    description: t('common.meta.description', { chainName }),
    openGraph: {
      images: getOpenGraphImageUrl(`/scam-tracker/${slug}`, locale),
    },
  };
};

const ScamTrackerPage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);
  const t = useTranslations();
  const messages = useMessages();

  const chainId = getChainIdFromSlug(params.slug);
  const chainName = getChainName(chainId);

  // Pass only serializable props (chainId and chainName) to the client component.
  return (
    <NextIntlClientProvider messages={{ common: messages.common, scam_tracker: messages.scam_tracker }}>
      <div className="flex flex-col items-center m-auto gap-4 px-4">
        <div className="flex flex-col items-center w-full">
          <h1 className="text-4xl md:text-5xl not-prose items-center gap-2 mb-12 text-center">
            <ChainLogo chainId={chainId} size={56} className="inline align-middle" />{' '}
            <div className="inline align-middle">{t('scam_tracker.title', { chainName })}</div>
          </h1>
        </div>
        <ScamTrackerContent chainId={chainId} chainName={chainName} />
        <Prose className="max-w-3xl">
          <ChainDescription chainId={chainId} headingElement="h2" />
        </Prose>
      </div>
    </NextIntlClientProvider>
  );
};

export default ScamTrackerPage;
