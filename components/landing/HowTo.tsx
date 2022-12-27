import { LinkIcon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import ExplanationBubble from './ExplanationBubble';

const HowTo = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-8 w-full p-8 pb-16 bg-black text-gray-100">
      <h2 className="text-3xl md:text-4xl text-center">{t('landing:how_to.title')}</h2>
      <div className="flex flex-col md:flex-row gap-4">
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
    </div>
  );
};

export default HowTo;
