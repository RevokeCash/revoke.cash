import PublicLayout from 'layouts/PublicLayout';
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
      <PublicLayout>
        <div className="flex flex-col gap-2 text-lg leading-none">
          <h1 className="text-center">{t('faq:title')}</h1>

          <div>
            <h4>{t('faq:questions.whole_wallet_at_risk.question')}</h4>
            <Trans
              i18nKey="faq:questions.whole_wallet_at_risk.answer"
              components={[<span style={{ fontStyle: 'italic' }} />]}
            />
          </div>

          <div>
            <h4>{t('faq:questions.enough_to_disconnect.question')}</h4>
            <Trans
              i18nKey="faq:questions.enough_to_disconnect.answer"
              components={[<span style={{ fontStyle: 'italic' }} />]}
            />
          </div>

          <div>
            <h4>{t('faq:questions.hardware_wallets.question')}</h4>
            <Trans
              i18nKey="faq:questions.hardware_wallets.answer"
              components={[<span style={{ fontStyle: 'italic' }} />]}
            />
          </div>

          <div>
            <h4>{t('faq:questions.multiple_allowances.question')}</h4>
            <Trans
              i18nKey="faq:questions.multiple_allowances.answer"
              components={[<span style={{ fontStyle: 'italic' }} />]}
            />
          </div>

          <div>
            <h4>{t('faq:questions.costs.question')}</h4>
            <Trans
              i18nKey="faq:questions.costs.answer"
              components={[<a href="https://gashawk.io" target="_blank" />]}
            />
          </div>

          <div>
            <h4>{t('faq:questions.wallet_mentions_approve.question')}</h4>
            <Trans i18nKey="faq:questions.wallet_mentions_approve.answer" />
          </div>

          <div>
            <h4>{t('faq:questions.recover_assets.question')}</h4>
            <Trans
              i18nKey="faq:questions.recover_assets.answer"
              components={[<span style={{ fontStyle: 'italic' }} />]}
            />
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
                <Link href="/extension">
                  <a />
                </Link>,
                <a href="https://twitter.com/RevokeCash" target="_blank" />,
                <a href={DISCORD_URL} target="_blank" />,
              ]}
            />
          </div>

          <div>
            <h4>{t('faq:questions.other_question.question')}</h4>
            <Trans
              i18nKey="faq:questions.other_question.answer"
              components={[
                <a href="https://twitter.com/RevokeCash" target="_blank" />,
                <a href={DISCORD_URL} target="_blank" />,
              ]}
            />
          </div>
        </div>
      </PublicLayout>
    </>
  );
};

export default Faq;
