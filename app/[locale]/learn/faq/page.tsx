import LearnLayout from 'app/layouts/LearnLayout';
import ChainLogo from 'components/common/ChainLogo';
import Href from 'components/common/Href';
import FaqItem from 'components/faq/FaqItem';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName, getChainSlug } from 'lib/utils/chains';
import { getSidebar } from 'lib/utils/markdown-content';
import { getOpenGraphImageUrl } from 'lib/utils/og';
import type { Metadata, NextPage } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: {
    locale: string;
  };
}

export const dynamic = 'error';

export const generateMetadata = async ({ params: { locale } }): Promise<Metadata> => {
  const t = await getTranslations({ locale });

  return {
    title: t('faq.meta.title'),
    description: t('faq.meta.description'),
    openGraph: {
      images: getOpenGraphImageUrl('/learn/faq', locale),
    },
  };
};

const FaqPage: NextPage = async ({ params }: Props) => {
  unstable_setRequestLocale(params.locale);

  const sidebar = await getSidebar(params.locale, 'learn');
  const t = await getTranslations({ locale: params.locale });

  const meta = {
    title: t('learn.sidebar.faq'),
    sidebarTitle: t('learn.sidebar.faq'),
    description: t('faq.meta.description'),
    language: params.locale,
  };

  return (
    <LearnLayout sidebarEntries={sidebar} slug={['faq']} meta={meta}>
      <h1>{t('faq.title')}</h1>

      <dl
        className="w-full divide-y divide-zinc-200 dark:divide-zinc-800 pr-6 lg:pr-4"
        vocab="https://schema.org/"
        typeof="FAQPage"
      >
        <FaqItem question={t('faq.questions.recover_assets.question')} slug="recover_assets">
          {t.rich('faq.questions.recover_assets.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.multiple_allowances.question')} slug="multiple_allowances">
          {t.rich('faq.questions.multiple_allowances.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.sweeper_bot.question')} slug="sweeper_bot">
          {t.rich('faq.questions.sweeper_bot.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.enough_to_disconnect.question')} slug="enough_to_disconnect">
          {t.rich('faq.questions.enough_to_disconnect.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.hardware_wallets.question')} slug="hardware_wallets">
          {t.rich('faq.questions.hardware_wallets.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.costs.question')} slug="costs">
          {t.rich('faq.questions.costs.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.wallet_mentions_approve.question')} slug="wallet_mentions_approve">
          {t.rich('faq.questions.wallet_mentions_approve.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.deposited_tokens.question')} slug="deposited_tokens">
          {t.rich('faq.questions.deposited_tokens.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.which_allowances.question')} slug="which_allowances">
          {t.rich('faq.questions.which_allowances.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.testnet_allowances.question')} slug="testnet_allowances">
          {t.rich('faq.questions.testnet_allowances.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.which_chains.question')} slug="which_chains" wrapper="div">
          <p>{t.rich('faq.questions.which_chains.answer')}</p>
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
          {t.rich('faq.questions.which_domains.answer')}
        </FaqItem>
        <FaqItem question={t('faq.questions.other_question.question')} slug="other_question">
          {t.rich('faq.questions.other_question.answer')}
        </FaqItem>
      </dl>
    </LearnLayout>
  );
};

export default FaqPage;
