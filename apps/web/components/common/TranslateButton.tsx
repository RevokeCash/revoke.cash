import { LanguageIcon } from '@heroicons/react/24/solid';
import { useLocale, useTranslations } from 'next-intl';
import Href from './Href';

interface Props {
  language: string;
  translationUrl?: string;
}

const TranslateButton = ({ language, translationUrl }: Props) => {
  const t = useTranslations();
  const locale = useLocale();

  if (locale === language || !translationUrl) {
    return null;
  }

  return (
    <Href href={translationUrl} className="mb-2 flex items-center gap-1" underline="hover" external>
      <LanguageIcon className="h-4 w-4" />
      {t('common.buttons.translate')}
    </Href>
  );
};

export default TranslateButton;
