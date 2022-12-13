import Href from 'components/common/Href';
import ContentPageLayout from 'layouts/ContentPageLayout';
import { DISCORD_URL } from 'lib/constants';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';

const Faq: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo {...defaultSEO} title={t('faq:meta.title')} description={t('faq:meta.description')} />
      <ContentPageLayout>
        <div className="flex flex-col gap-2 text-lg leading-none">
          <h1>{t('faq:title')}</h1>

          <div>
            <h4>{t('faq:questions.whole_wallet_at_risk.question')}</h4>
            <Trans i18nKey="faq:questions.whole_wallet_at_risk.answer" components={[<span className="italic" />]} />
          </div>

          <div>
            <h4>{t('faq:questions.enough_to_disconnect.question')}</h4>
            <Trans i18nKey="faq:questions.enough_to_disconnect.answer" components={[<span className="italic" />]} />
          </div>

          <div>
            <h4>{t('faq:questions.hardware_wallets.question')}</h4>
            <Trans i18nKey="faq:questions.hardware_wallets.answer" components={[<span className="italic" />]} />
          </div>

          <div>
            <h4>{t('faq:questions.multiple_allowances.question')}</h4>
            <Trans i18nKey="faq:questions.multiple_allowances.answer" components={[<span className="italic" />]} />
          </div>

          <div>
            <h4>{t('faq:questions.costs.question')}</h4>
            <Trans
              i18nKey="faq:questions.costs.answer"
              components={[<Href href="https://gashawk.io" html external />]}
            />
          </div>

          <div>
            <h4>{t('faq:questions.wallet_mentions_approve.question')}</h4>
            <Trans i18nKey="faq:questions.wallet_mentions_approve.answer" />
          </div>

          <div>
            <h4>{t('faq:questions.recover_assets.question')}</h4>
            <Trans i18nKey="faq:questions.recover_assets.answer" components={[<span className="italic" />]} />
          </div>

          <div>
            <h4>{t('faq:questions.stolen_through_allowances.question')}</h4>
            <Trans i18nKey="faq:questions.stolen_through_allowances.answer" />
          </div>

          <div>
            <h4>{t('faq:questions.sweeper_bot.question')}</h4>
            <Trans i18nKey="faq:questions.sweeper_bot.answer" />
          </div>

          <div>
            <h4>{t('faq:questions.which_allowances.question')}</h4>
            <Trans i18nKey="faq:questions.which_allowances.answer" />
          </div>

          <div>
            <h4>{t('faq:questions.which_chains.question')}</h4>
            <Trans
              i18nKey="faq:questions.which_chains.answer"
              components={[
                <Href href="/extension" html router />,
                <Href href="https://twitter.com/RevokeCash" html external />,
                <Href href={DISCORD_URL} html external />,
              ]}
            />
          </div>

          <div>
            <h4>{t('faq:questions.other_question.question')}</h4>
            <Trans
              i18nKey="faq:questions.other_question.answer"
              components={[
                <Href href="https://twitter.com/RevokeCash" html external />,
                <Href href={DISCORD_URL} html external />,
              ]}
            />
          </div>
        </div>
      </ContentPageLayout>
    </>
  );
};

export default Faq;
