import Divider from 'components/common/Divider';
import FadeIn from 'components/common/FadeIn';
import RichText from 'components/common/RichText';
import { useTranslations } from 'next-intl';
import FullWidthLandingSection from './FullWidthLandingSection';
import LandingPageFaqItem from './LandingPageFaqItem';

const LandingPageFaq = () => {
  const t = useTranslations();

  return (
    <FullWidthLandingSection title={t('landing.faq.title')} size="md">
      <FadeIn stagger className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-12 md:gap-y-10">
        <LandingPageFaqItem question={t('faq.questions.recover_assets.question')}>
          <RichText>{(tags) => t.rich('faq.questions.recover_assets.answer', tags)}</RichText>
        </LandingPageFaqItem>
        <LandingPageFaqItem question={t('faq.questions.hardware_wallets.question')}>
          <RichText>{(tags) => t.rich('faq.questions.hardware_wallets.answer', tags)}</RichText>
        </LandingPageFaqItem>
        <LandingPageFaqItem question={t('faq.questions.sweeper_bot.question')}>
          <RichText>{(tags) => t.rich('faq.questions.sweeper_bot.answer', tags)}</RichText>
        </LandingPageFaqItem>
        <LandingPageFaqItem question={t('faq.questions.enough_to_disconnect.question')}>
          <RichText>{(tags) => t.rich('faq.questions.enough_to_disconnect.answer', tags)}</RichText>
        </LandingPageFaqItem>
      </FadeIn>
      <Divider />
      <p className="text-zinc-700 dark:text-zinc-300">
        <RichText>{(tags) => t.rich('landing.faq.subtitle', tags)}</RichText>
      </p>
    </FullWidthLandingSection>
  );
};

export default LandingPageFaq;
