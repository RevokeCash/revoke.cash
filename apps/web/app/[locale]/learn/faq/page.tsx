import LearnLayout from 'app/layouts/LearnLayout';
import { BASE_FEE, PER_ALLOWANCE_FEE } from 'components/allowances/controls/batch-revoke/fee';
import ChainLogo from 'components/common/ChainLogo';
import Href from 'components/common/Href';
import RichText from 'components/common/RichText';
import Faq from 'components/faq/Faq';
import FaqItem from 'components/faq/FaqItem';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName, getChainSlug } from 'lib/utils/chains';
import { getSidebar } from 'lib/utils/markdown-content';
import { getOpenGraphImageUrl } from 'lib/utils/og';
import type { Metadata, NextPage } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const dynamic = 'error';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;

  const t = await getTranslations({ locale });

  return {
    title: t('faq.meta.title'),
    description: t('faq.meta.description'),
    openGraph: {
      images: getOpenGraphImageUrl('/learn/faq', locale),
    },
  };
};

const FaqPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const sidebar = await getSidebar(locale, 'learn');
  const t = await getTranslations({ locale });

  const meta = {
    title: t('learn.sidebar.faq'),
    sidebarTitle: t('learn.sidebar.faq'),
    description: t('faq.meta.description'),
    language: locale,
  };

  return (
    <LearnLayout sidebarEntries={sidebar} slug={['faq']} meta={meta}>
      <h1>{t('faq.title')}</h1>

      <Faq>
        <FaqItem question={t('faq.questions.recover_assets.question')} slug="recover_assets">
          <RichText>{(tags) => t.rich('faq.questions.recover_assets.answer', tags)}</RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.sweeper_bot.question')} slug="sweeper_bot">
          <RichText>{(tags) => t.rich('faq.questions.sweeper_bot.answer', tags)}</RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.enough_to_disconnect.question')} slug="enough_to_disconnect">
          <RichText>{(tags) => t.rich('faq.questions.enough_to_disconnect.answer', tags)}</RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.costs.question')} slug="costs">
          <RichText>
            {(tags) =>
              t.rich('faq.questions.costs.answer', {
                ...tags,
                BASE_FEE: BASE_FEE.toFixed(2),
                PER_ALLOWANCE_FEE: PER_ALLOWANCE_FEE.toFixed(2),
              })
            }
          </RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.hardware_wallets.question')} slug="hardware_wallets">
          <RichText>{(tags) => t.rich('faq.questions.hardware_wallets.answer', tags)}</RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.wallet_mentions_approve.question')} slug="wallet_mentions_approve">
          <RichText>{(tags) => t.rich('faq.questions.wallet_mentions_approve.answer', tags)}</RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.deposited_tokens.question')} slug="deposited_tokens">
          <RichText>{(tags) => t.rich('faq.questions.deposited_tokens.answer', tags)}</RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.which_allowances.question')} slug="which_allowances">
          <RichText>{(tags) => t.rich('faq.questions.which_allowances.answer', tags)}</RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.testnet_allowances.question')} slug="testnet_allowances">
          <RichText>{(tags) => t.rich('faq.questions.testnet_allowances.answer', tags)}</RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.which_chains.question')} slug="which_chains" wrapper="div">
          <p>
            <RichText>{(tags) => t.rich('faq.questions.which_chains.answer', tags)}</RichText>
          </p>
          <h3 className="text-xl mt-4 mb-2 not-prose">{t('common.chain_select.mainnets')}</h3>
          <ul className="text-base grid grid-cols-2 sm:grid-cols-3 gap-2 not-prose">
            {CHAIN_SELECT_MAINNETS.map((chainId) => (
              <li key={chainId}>
                <Href
                  href={`/token-approval-checker/${getChainSlug(chainId)}`}
                  router
                  underline="hover"
                  className="flex items-center gap-1"
                >
                  {<ChainLogo chainId={chainId} />}
                  <div className="shrink-0 truncate max-sm:w-32">{getChainName(chainId)}</div>
                </Href>
              </li>
            ))}
          </ul>
          <h3 className="text-xl mt-4 mb-2 not-prose">{t('common.chain_select.testnets')}</h3>
          <ul className="text-base grid grid-cols-2 sm:grid-cols-3 gap-2 not-prose">
            {CHAIN_SELECT_TESTNETS.map((chainId) => (
              <li key={chainId}>
                <Href
                  href={`/token-approval-checker/${getChainSlug(chainId)}`}
                  router
                  underline="hover"
                  className="flex items-center gap-1"
                >
                  {<ChainLogo chainId={chainId} />}
                  <div className="shrink-0 truncate max-sm:w-32">{getChainName(chainId)}</div>
                </Href>
              </li>
            ))}
          </ul>
        </FaqItem>
        <FaqItem question={t('faq.questions.which_domains.question')} slug="which_domains">
          <RichText>{(tags) => t.rich('faq.questions.which_domains.answer', tags)}</RichText>
        </FaqItem>
        <FaqItem question={t('faq.questions.other_question.question')} slug="other_question">
          <RichText>{(tags) => t.rich('faq.questions.other_question.answer', tags)}</RichText>
        </FaqItem>
      </Faq>
    </LearnLayout>
  );
};

export default FaqPage;
