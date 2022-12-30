import Divider from 'components/common/Divider';
import Href from 'components/common/Href';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import LandingPageFaqItem from './LandingPageFaqItem';
import LandingSection from './LandingSection';

const LandingPageFaq = () => {
  const { t } = useTranslation();

  return (
    <LandingSection title={t('landing:faq.title')} size="md">
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6 md:gap-y-8">
        <LandingPageFaqItem question={t('faq:questions.whole_wallet_at_risk.question')}>
          <Trans i18nKey="faq:questions.whole_wallet_at_risk.answer" components={[<span className="italic" />]} />
        </LandingPageFaqItem>
        <LandingPageFaqItem question={t('faq:questions.enough_to_disconnect.question')}>
          <Trans i18nKey="faq:questions.enough_to_disconnect.answer" components={[<span className="italic" />]} />
        </LandingPageFaqItem>
        <LandingPageFaqItem question={t('faq:questions.recover_assets.question')}>
          <Trans i18nKey="faq:questions.recover_assets.answer" components={[<span className="italic" />]} />
        </LandingPageFaqItem>
        <LandingPageFaqItem question={t('faq:questions.sweeper_bot.question')}>
          <Trans i18nKey="faq:questions.sweeper_bot.answer" />
        </LandingPageFaqItem>
      </dl>
      <Divider className="border-gray-200" />
      <p className="text-gray-700">
        <Trans
          i18nKey="landing:faq.subtitle"
          components={[<Href href="/faq" className="font-medium" html underline="hover" />]}
        />
      </p>
    </LandingSection>
  );
};

export default LandingPageFaq;
