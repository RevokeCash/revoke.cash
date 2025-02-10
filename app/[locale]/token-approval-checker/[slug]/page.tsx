import ChainDescription from 'components/common/ChainDescription';
import ChainLogo from 'components/common/ChainLogo';
import Href from 'components/common/Href';
import Prose from 'components/common/Prose';
import { locales } from 'lib/i18n/config';
import { SUPPORTED_CHAINS, getChainIdFromSlug, getChainName, getChainSlug } from 'lib/utils/chains';
import { getOpenGraphImageUrl } from 'lib/utils/og';
import type { Metadata, NextPage } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import TokenApprovalCheckerChainSelect from './TokenApprovalCheckerChainSelect';
import TokenApprovalCheckerSearchBox from './TokenApprovalCheckerSearchBox';

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
    title: t('token_approval_checker.meta.title', { chainName }),
    description: t('common.meta.description', { chainName }),
    openGraph: {
      images: getOpenGraphImageUrl(`/token-approval-checker/${slug}`, locale),
    },
  };
};

const TokenApprovalCheckerPage: NextPage<Props> = async ({ params }) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  const chainId = getChainIdFromSlug(slug);
  const chainName = getChainName(chainId);

  return (
    <div className="flex flex-col items-center m-auto gap-4 px-4">
      <div className="flex flex-col items-center w-full">
        <h1 className="text-4xl md:text-5xl not-prose items-center gap-2 mb-12 text-center">
          <ChainLogo chainId={chainId} size={56} className="inline align-middle" />{' '}
          <div className="inline align-middle">{t('token_approval_checker.title', { chainName })}</div>
        </h1>
        <TokenApprovalCheckerSearchBox chainId={chainId} placeholder={t('common.nav.search')} />
        <div className="flex flex-col sm:flex-row items-center gap-2 my-4">
          <p className="m-0">{t('token_approval_checker.different_chain')}:</p>
          <div className="not-prose shrink-0">
            <TokenApprovalCheckerChainSelect chainId={chainId} />
          </div>
        </div>
      </div>
      <Prose className="max-w-3xl">
        <ChainDescription chainId={chainId} headingElement="h2" />
        <p>
          {t.rich('networks.learn_how_to_add_to_wallet', {
            chainName,
            'add-network-link': (children) => (
              <Href href={`/learn/wallets/add-network/${getChainSlug(chainId)}`} underline="hover" html router>
                {children}
              </Href>
            ),
          })}
        </p>
        <h2 className="text-left">{t('token_approval_checker.what_are_token_approvals.title', { chainName })}</h2>
        <p>
          {t.rich('token_approval_checker.what_are_token_approvals.content', {
            chainName,
            whatAreTokenApprovals: (children) => (
              <Href href="/learn/approvals/what-are-token-approvals" html underline="hover" router>
                {children}
              </Href>
            ),
          })}
        </p>
        <h2>{t('token_approval_checker.how_to_revoke.title', { chainName })}</h2>
        <p>
          {t.rich('token_approval_checker.how_to_revoke.content', {
            chainName,
            howToRevoke: (children) => (
              <Href href="/learn/approvals/how-to-revoke-token-approvals" html underline="hover" router>
                {children}
              </Href>
            ),
          })}
        </p>
      </Prose>
    </div>
  );
};

export default TokenApprovalCheckerPage;
