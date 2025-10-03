import { LinkIcon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import RichText from 'components/common/RichText';
import { useTranslations } from 'next-intl';
import ExplanationBubble from './ExplanationBubble';
import FullWidthLandingSection from './FullWidthLandingSection';

const HowTo = () => {
  const t = useTranslations();

  return (
    <FullWidthLandingSection title={t('landing.how_to.title')} inverted>
      <div className="flex flex-col md:flex-row gap-4 pt-8">
        <ExplanationBubble title={t('landing.how_to.paragraph_1.title')} icon={<LinkIcon className="w-12 h-12" />}>
          <RichText>{(tags) => t.rich('landing.how_to.paragraph_1.description', tags)}</RichText>
        </ExplanationBubble>
        <ExplanationBubble
          title={t('landing.how_to.paragraph_2.title')}
          icon={<MagnifyingGlassIcon className="w-12 h-12" />}
        >
          {t('landing.how_to.paragraph_2.description')}
        </ExplanationBubble>
        <ExplanationBubble title={t('landing.how_to.paragraph_3.title')} icon={<XCircleIcon className="w-12 h-12" />}>
          {t('landing.how_to.paragraph_3.description')}
        </ExplanationBubble>
      </div>
    </FullWidthLandingSection>
  );
};

export default HowTo;
