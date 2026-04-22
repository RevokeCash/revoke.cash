import { LinkIcon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import FadeIn from 'components/common/FadeIn';
import RichText from 'components/common/RichText';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import ExplanationBubble from './ExplanationBubble';
import FullWidthLandingSection from './FullWidthLandingSection';

const HowTo = () => {
  const t = useTranslations();

  return (
    <FullWidthLandingSection title={t('landing.how_to.title')} inverted className="pt-8">
      <FadeIn stagger className="w-full flex flex-col md:flex-row justify-center items-center md:items-stretch gap-0">
        <Step>
          <ExplanationBubble title={t('landing.how_to.paragraph_1.title')} icon={<LinkIcon className="w-12 h-12" />}>
            <RichText>{(tags) => t.rich('landing.how_to.paragraph_1.description', tags)}</RichText>
          </ExplanationBubble>
        </Step>
        <Step>
          <StepConnector />
          <ExplanationBubble
            title={t('landing.how_to.paragraph_2.title')}
            icon={<MagnifyingGlassIcon className="w-12 h-12" />}
          >
            {t('landing.how_to.paragraph_2.description')}
          </ExplanationBubble>
        </Step>
        <Step>
          <StepConnector />
          <ExplanationBubble title={t('landing.how_to.paragraph_3.title')} icon={<XCircleIcon className="w-12 h-12" />}>
            {t('landing.how_to.paragraph_3.description')}
          </ExplanationBubble>
        </Step>
      </FadeIn>
    </FullWidthLandingSection>
  );
};

export default HowTo;

const Step = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col md:flex-row items-center md:items-stretch">{children}</div>
);

const StepConnector = () => (
  <>
    <div className="hidden md:flex items-center shrink-0 px-1">
      <div className="w-6 border-t border-dashed border-zinc-600" />
    </div>
    <div className="flex md:hidden justify-center py-1">
      <div className="h-4 border-l border-dashed border-zinc-600" />
    </div>
  </>
);
