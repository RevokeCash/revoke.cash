import { LanguageIcon } from '@heroicons/react/24/solid';
import useTranslation from 'next-translate/useTranslation';
import Href from './Href';

interface Props {
  language: string;
  translationUrl?: string;
}

const TranslateButton = ({ language, translationUrl }: Props) => {
  const { t, lang } = useTranslation();

  if (lang === language || !translationUrl) {
    return null;
  }

  return (
    <Href href={translationUrl} className="mb-2 flex items-center gap-1" underline="hover" external>
      <LanguageIcon className="h-4 w-4" />
      {t('common:buttons.translate')}
    </Href>
  );
};

export default TranslateButton;
