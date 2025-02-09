import ChainDescription from 'components/common/ChainDescription';
import ChainLogo from 'components/common/ChainLogo';
import Prose from 'components/common/Prose';
import { locales } from 'lib/i18n/config';
import { SUPPORTED_CHAINS, getChainIdFromSlug, getChainName, getChainSlug } from 'lib/utils/chains';
import { getOpenGraphImageUrl } from 'lib/utils/og';
import type { Metadata, NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import ScamTrackerChainSelect from './ScamTrackerChainSelect';
import ScamTrackerContent from './ScamTrackerContent';
import ScamTrackerSearchBox from './ScamTrackerSearchBox';

interface Props {
  params: {
    locale: string;
    slug: string;
  };
}

export const dynamic = 'error';
export const dynamicParams = false;

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

  const chainId = getChainIdFromSlug(params.slug);
  const chainName = getChainName(chainId);

  return (
    <div className="flex flex-col items-center m-auto gap-4 px-4">
      <div className="flex flex-col items-center w-full">
        <h1 className="text-4xl md:text-5xl not-prose items-center gap-2 mb-12 text-center">
          <ChainLogo chainId={chainId} size={56} className="inline align-middle" />{' '}
          <div className="inline align-middle">{t('scam_tracker.title', { chainName })}</div>
        </h1>
      </div>
      <ScamTrackerSearchBox chainId={chainId} placeholder={t('scam_tracker.placeholder')} />
      <div className="flex flex-col sm:flex-row items-center gap-2 my-4">
        <p className="m-0">{t('scam_tracker.different_chain')}:</p>
        <div className="not-prose shrink-0">
          <ScamTrackerChainSelect chainId={chainId} />
        </div>
      </div>
      <ScamTrackerContent chainId={chainId} />
      <Prose className="max-w-3xl">
        <ChainDescription chainId={chainId} headingElement="h2" />
        <h2>{t('scam_tracker.what_is_fund_flow.title', { chainName })}</h2>
        <p>{t('scam_tracker.what_is_fund_flow.content', { chainName })}</p>
        <h2>{t('scam_tracker.how_to_track.title', { chainName })}</h2>
        <p>{t('scam_tracker.how_to_track.content', { chainName })}</p>
      </Prose>
    </div>
  );
};

export default ScamTrackerPage;
