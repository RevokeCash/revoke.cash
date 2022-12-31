import Divider from 'components/common/Divider';
import Href from 'components/common/Href';
import FaqItem from 'components/faq/FaqItem';
import ContentPageLayout from 'layouts/ContentPageLayout';
import { DISCORD_URL, TWITTER_URL } from 'lib/constants';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';

const FaqPage: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo {...defaultSEO} title={t('faq:meta.title')} description={t('faq:meta.description')} />
      <ContentPageLayout>
        <h1>{t('faq:title')}</h1>

        <Divider className="mt-4" />

        <dl className="divide-y divide-gray-200 dark:divide-gray-800">
          <FaqItem question={t('faq:questions.whole_wallet_at_risk.question')}>
            <Trans i18nKey="faq:questions.whole_wallet_at_risk.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.enough_to_disconnect.question')}>
            <Trans i18nKey="faq:questions.enough_to_disconnect.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.recover_assets.question')}>
            <Trans i18nKey="faq:questions.recover_assets.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.sweeper_bot.question')}>
            <Trans i18nKey="faq:questions.sweeper_bot.answer" />
          </FaqItem>
          <FaqItem question={t('faq:questions.stolen_through_allowances.question')}>
            <div className="flex flex-col items-center">
              <Trans i18nKey="faq:questions.stolen_through_allowances.answer" />
              <div className="flex border border-black">
                <Image src="/assets/images/how-did-i-get-scammed-light.png" width={1024} height={977} />
              </div>
            </div>
          </FaqItem>
          <FaqItem question={t('faq:questions.hardware_wallets.question')}>
            <Trans i18nKey="faq:questions.hardware_wallets.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.multiple_allowances.question')}>
            <Trans i18nKey="faq:questions.multiple_allowances.answer" components={[<span className="italic" />]} />
          </FaqItem>
          <FaqItem question={t('faq:questions.costs.question')}>
            <Trans
              i18nKey="faq:questions.costs.answer"
              components={[<Href href="https://gashawk.io" className="font-medium" underline="hover" html external />]}
            />
          </FaqItem>
          <FaqItem question={t('faq:questions.wallet_mentions_approve.question')}>
            <Trans i18nKey="faq:questions.wallet_mentions_approve.answer" />
          </FaqItem>
          <FaqItem question={t('faq:questions.deposited_tokens.question')}>
            <Trans i18nKey="faq:questions.deposited_tokens.answer" />
          </FaqItem>
          <FaqItem question={t('faq:questions.which_allowances.question')}>
            <Trans i18nKey="faq:questions.which_allowances.answer" />
          </FaqItem>
          <FaqItem question={t('faq:questions.which_chains.question')}>
            <Trans
              i18nKey="faq:questions.which_chains.answer"
              components={[
                <Href href="/extension" className="font-medium" underline="hover" html router />,
                <Href href={TWITTER_URL} className="font-medium" underline="hover" html external />,
                <Href href={DISCORD_URL} className="font-medium" underline="hover" html external />,
              ]}
            />
          </FaqItem>
          <FaqItem question={t('faq:questions.other_question.question')}>
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
      </ContentPageLayout>
    </>
  );
};

export default FaqPage;
