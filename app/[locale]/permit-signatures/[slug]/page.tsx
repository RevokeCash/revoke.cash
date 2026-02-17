import ChainDescription from 'components/common/ChainDescription';
import ChainLogo from 'components/common/ChainLogo';
import Prose from 'components/common/Prose';
import RichText from 'components/common/RichText';
import { locales } from 'lib/i18n/config';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { getChainIdFromSlug, getChainName, getChainSlug, SUPPORTED_CHAINS } from 'lib/utils/chains';
import { getOpenGraphImageUrl } from 'lib/utils/og';
import type { Metadata, NextPage } from 'next';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import PermitSignaturesChainSelect from './PermitSignaturesChainSelect';
import PermitSignaturesChecker from './PermitSignaturesChecker';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  slug: string;
}

export const dynamic = 'error';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const slugs = SUPPORTED_CHAINS.map(getChainSlug);
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale, slug } = await params;

  const t = await getTranslations({ locale });
  const chainId = getChainIdFromSlug(slug);
  const chainName = getChainName(chainId);

  return {
    title: t('signatures.permit.meta.title', { chainName }),
    description: t('common.meta.description', { chainName }),
    openGraph: {
      images: getOpenGraphImageUrl(`/permit-signatures/${slug}`, locale),
    },
  };
};

const PermitSignaturesPage: NextPage<Props> = async ({ params }) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const messages = await getMessages({ locale });

  const chainId = getChainIdFromSlug(slug);
  const chainName = getChainName(chainId);

  return (
    <div className="flex flex-col items-center m-auto gap-4 px-4">
      <div className="flex flex-col items-center w-full">
        <h1 className="text-4xl md:text-5xl not-prose items-center gap-2 text-center">
          <ChainLogo chainId={chainId} size={56} className="inline align-middle" />{' '}
          <div className="inline align-middle">{t('signatures.permit.title', { chainName })}</div>
        </h1>
      </div>
      <Prose className="max-w-3xl mb-4">
        <ChainDescription chainId={chainId} headingElement="h2" />
        <h2 className="text-left">{t('signatures.permit.what_are_permit_signatures.title', { chainName })}</h2>
        <p>
          <RichText>{(tags) => t.rich('signatures.permit.what_are_permit_signatures.content', { ...tags })}</RichText>
        </p>
      </Prose>
      <div className="flex flex-col items-center w-full">
        <Suspense>
          <NextIntlClientProvider messages={{ common: messages.common, signatures: messages.signatures }}>
            <PermitSignaturesChecker chainId={chainId} />
          </NextIntlClientProvider>
          <div className="flex flex-col sm:flex-row items-center gap-2 my-4">
            <p className="m-0">{t('signatures.permit.different_chain')}:</p>
            <div className="not-prose shrink-0">
              <PermitSignaturesChainSelect chainId={chainId} />
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default PermitSignaturesPage;
