import ChainLogo from 'components/common/ChainLogo';
import Href from 'components/common/Href';
import Prose from 'components/common/Prose';
import FaqItem from 'components/faq/FaqItem';
import LearnLayout from 'layouts/LearnLayout';
import { DISCORD_URL, TWITTER_URL } from 'lib/constants';
import { ISidebarEntry } from 'lib/interfaces';
import { defaultSEO } from 'lib/next-seo.config';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName, getChainSlug } from 'lib/utils/chains';
import { getSidebar } from 'lib/utils/markdown-content';
import type { GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';

interface Props {
  sidebar: ISidebarEntry[];
}

const FaqPage: NextPage = ({ sidebar }: Props) => {
  const { t, lang } = useTranslation();
  const meta = {
    title: t('learn:sidebar.faq'),
    sidebarTitle: t('learn:sidebar.faq'),
    description: t('faq:meta.description'),
    language: lang,
  };

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={t('faq:meta.title')}
        description={t('faq:meta.description')}
        openGraph={{
          ...defaultSEO.openGraph,
          images: [{ url: `https://revoke.cash/assets/images/learn/faq/cover.jpg`, width: 1600, height: 900 }],
        }}
      />
      <LearnLayout sidebarEntries={sidebar} slug={['faq']} meta={meta}>
        <h1>{t('faq:title')}</h1>

        <dl
          className="w-full divide-y divide-zinc-200 dark:divide-zinc-800 pr-6 lg:pr-4"
          vocab="https://schema.org/"
          typeof="FAQPage"
        >
          <FaqItem question={t('faq:questions.whole_wallet_at_risk.question')} slug="whole_wallet_at_risk">
            <Trans i18nKey="faq:questions.whole_wallet_at_risk.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.enough_to_disconnect.question')} slug="enough_to_disconnect">
            <Trans i18nKey="faq:questions.enough_to_disconnect.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.recover_assets.question')} slug="recover_assets">
            <Trans i18nKey="faq:questions.recover_assets.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.sweeper_bot.question')} slug="sweeper_bot">
            <Trans i18nKey="faq:questions.sweeper_bot.answer" />
          </FaqItem>
          <FaqItem question={t('faq:questions.stolen_through_allowances.question')} slug="stolen_through_allowances">
            <Prose>
              <p className="flex flex-col items-center">
                <Trans i18nKey="faq:questions.stolen_through_allowances.answer" />
                <Image
                  src="/assets/images/how-did-i-get-scammed-light.png"
                  alt="How Did I Get Scammed?"
                  width="1024"
                  height="977"
                />
              </p>
            </Prose>
          </FaqItem>
          <FaqItem question={t('faq:questions.hardware_wallets.question')} slug="hardware_wallets">
            <Trans i18nKey="faq:questions.hardware_wallets.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.multiple_allowances.question')} slug="multiple_allowances">
            <Trans i18nKey="faq:questions.multiple_allowances.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.costs.question')} slug="costs">
            <Trans
              i18nKey="faq:questions.costs.answer"
              components={[<Href href="https://gashawk.io" className="font-medium" underline="hover" html external />]}
            />
          </FaqItem>
          <FaqItem question={t('faq:questions.wallet_mentions_approve.question')} slug="wallet_mentions_approve">
            <Trans i18nKey="faq:questions.wallet_mentions_approve.answer" />
          </FaqItem>
          <FaqItem question={t('faq:questions.deposited_tokens.question')} slug="deposited_tokens">
            <Trans i18nKey="faq:questions.deposited_tokens.answer" />
          </FaqItem>
          <FaqItem question={t('faq:questions.which_allowances.question')} slug="which_allowances">
            <Trans i18nKey="faq:questions.which_allowances.answer" />
          </FaqItem>
          <FaqItem question={t('faq:questions.which_chains.question')} slug="which_chains">
            <Trans
              i18nKey="faq:questions.which_chains.answer"
              components={[
                <Href href="/extension" className="font-medium" underline="hover" html router />,
                <Href href={TWITTER_URL} className="font-medium" underline="hover" html external />,
                <Href href={DISCORD_URL} className="font-medium" underline="hover" html external />,
              ]}
            />
            <h3 className="text-xl mt-4 mb-2">{t('common:chain_select.mainnets')}</h3>
            <ul className="text-base grid grid-cols-2 sm:grid-cols-3 gap-2">
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
            <h3 className="text-xl mt-4 mb-2">{t('common:chain_select.testnets')}</h3>
            <ul className="text-base grid grid-cols-2 sm:grid-cols-3 gap-2">
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
          <FaqItem question={t('faq:questions.which_domains.question')} slug="which_domains">
            <Trans
              i18nKey="faq:questions.which_domains.answer"
              components={[
                <Href href="https://ens.domains" className="font-medium" underline="hover" html external />,
                <Href href="https://unstoppabledomains.com" className="font-medium" underline="hover" html external />,
                <Href href="https://avvy.domains" className="font-medium" underline="hover" html external />,
              ]}
            />
          </FaqItem>
          <FaqItem question={t('faq:questions.other_question.question')} slug="other_question">
            <Trans
              i18nKey="faq:questions.other_question.answer"
              components={[
                <Href href={TWITTER_URL} className="font-medium" underline="hover" html external />,
                <Href href={DISCORD_URL} className="font-medium" underline="hover" html external />,
                <Href
                  href="https://kalis.me/unlimited-erc20-allowances/"
                  className="italic font-medium"
                  underline="hover"
                  html
                  external
                />,
              ]}
            />
          </FaqItem>
        </dl>
      </LearnLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const sidebar = await getSidebar(locale, 'learn');

  return {
    props: { sidebar },
  };
};

export default FaqPage;
