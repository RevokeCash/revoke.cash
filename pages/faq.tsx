import Heading from 'components/common/Heading';
import { DISCORD_URL } from 'lib/constants';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import Link from 'next/link';

const Faq: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo {...defaultSEO} title={t('faq:meta.title')} description={t('faq:meta.description')} />
      <div
        style={{
          textAlign: 'left',
          fontSize: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '800px',
          margin: 'auto',
        }}
      >
        <Heading text={t('faq:title')} type="h2" center />

        <div>
          <Heading text={t('faq:questions.whole_wallet_at_risk.question')} type="h4" />
          <Trans
            i18nKey="faq:questions.whole_wallet_at_risk.answer"
            components={[<span style={{ fontStyle: 'italic' }} />]}
          />
        </div>

        <div>
          <Heading text={t('faq:questions.enough_to_disconnect.question')} type="h4" />
          <Trans
            i18nKey="faq:questions.enough_to_disconnect.answer"
            components={[<span style={{ fontStyle: 'italic' }} />]}
          />
        </div>

        <div>
          <Heading text={t('faq:questions.hardware_wallets.question')} type="h4" />
          <Trans
            i18nKey="faq:questions.hardware_wallets.answer"
            components={[<span style={{ fontStyle: 'italic' }} />]}
          />
        </div>

        <div>
          <Heading text={t('faq:questions.multiple_allowances.question')} type="h4" />
          <Trans
            i18nKey="faq:questions.multiple_allowances.answer"
            components={[<span style={{ fontStyle: 'italic' }} />]}
          />
        </div>

        <div>
          <Heading text={t('faq:questions.costs.question')} type="h4" />
          <Trans i18nKey="faq:questions.costs.answer" components={[<a href="https://gashawk.io" target="_blank" />]} />
        </div>

        <div>
          <Heading text={t('faq:questions.wallet_mentions_approve.question')} type="h4" />
          <Trans i18nKey="faq:questions.wallet_mentions_approve.answer" />
        </div>

        <div>
          <Heading text={t('faq:questions.recover_assets.question')} type="h4" />
          <Trans
            i18nKey="faq:questions.recover_assets.answer"
            components={[<span style={{ fontStyle: 'italic' }} />]}
          />
        </div>

        <div>
          <Heading text={t('faq:questions.stolen_through_allowances.question')} type="h4" />
          <Trans i18nKey="faq:questions.stolen_through_allowances.answer" />
        </div>

        <div>
          <Heading text={t('faq:questions.sweeper_bot.question')} type="h4" />
          <Trans i18nKey="faq:questions.sweeper_bot.answer" />
        </div>

        <div>
          <Heading text={t('faq:questions.which_allowances.question')} type="h4" />
          <Trans i18nKey="faq:questions.which_allowances.answer" />
        </div>

        <div>
          <Heading text={t('faq:questions.which_chains.question')} type="h4" />
          <Trans
            i18nKey="faq:questions.which_chains.answer"
            components={[
              <Link href="/extension">
                <a />
              </Link>,
              <a href="https://twitter.com/RevokeCash" target="_blank" />,
              <a href={DISCORD_URL} target="_blank" />,
            ]}
          />
        </div>

        <div>
          <Heading text={t('faq:questions.other_question.question')} type="h4" />
          <Trans
            i18nKey="faq:questions.other_question.answer"
            components={[
              <a href="https://twitter.com/RevokeCash" target="_blank" />,
              <a href={DISCORD_URL} target="_blank" />,
            ]}
          />
        </div>
      </div>
    </>
  );
};

export default Faq;
