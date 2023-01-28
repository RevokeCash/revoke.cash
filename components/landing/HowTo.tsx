import { LinkIcon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import ExplanationBubble from './ExplanationBubble';
import FullWidthLandingSection from './FullWidthLandingSection';

const HowTo = () => {
  const { t } = useTranslation();

  return (
    <FullWidthLandingSection title={t('landing:how_to.title')} inverted>
      <div className="flex flex-col md:flex-row gap-4 pt-8">
        <ExplanationBubble title={t('landing:how_to.paragraph_1.title')} icon={<LinkIcon className="w-12 h-12" />}>
          <Trans i18nKey="landing:how_to.paragraph_1.description" components={[<span className="italic" />]} />
        </ExplanationBubble>
        <ExplanationBubble
          title={t('landing:how_to.paragraph_2.title')}
          icon={<MagnifyingGlassIcon className="w-12 h-12" />}
        >
          <Trans i18nKey="landing:how_to.paragraph_2.description" />
        </ExplanationBubble>
        <ExplanationBubble title={t('landing:how_to.paragraph_3.title')} icon={<XCircleIcon className="w-12 h-12" />}>
          <Trans i18nKey="landing:how_to.paragraph_3.description" />
        </ExplanationBubble>
      </div>
    </FullWidthLandingSection>
  );
};

export default HowTo;
