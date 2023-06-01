import { LanguageIcon } from '@heroicons/react/24/solid';
import useTranslation from 'next-translate/useTranslation';
import Href from './Href';

interface Props {
  language: string;
}

const TranslateButton = ({ language }: Props) => {
  const { t, lang } = useTranslation();

  const LOCALAZY_BASE_URL = `https://localazy.com/p/revoke-cash-markdown-content/phrases`;

  const languageCodes = {
    zh: 1,
    ru: 1105,
    ja: 717,
    es: 458,
  };

  const href = `${LOCALAZY_BASE_URL}/${languageCodes[language]}/edit/<todo: path>`;

  if (lang === language) {
    return null;
  }

  return (
    <Href href={href} className="mb-2 flex items-center gap-1" underline="hover">
      <LanguageIcon className="h-4 w-4" />
      {t('common:buttons.translate')}
    </Href>
  );
};

export default TranslateButton;
