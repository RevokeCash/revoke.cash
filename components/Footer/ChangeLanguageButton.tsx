import { track } from '@amplitude/analytics-browser';
import { getLanguageEmoji, getLanguageNameNative } from 'lib/utils/languages';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { Dropdown } from 'react-bootstrap';

interface Props {
  locale: string;
}

const ChangeLanguageButton = ({ locale }: Props) => {
  const { asPath, replace } = useRouter();
  const { lang } = useTranslation();

  const persistLocaleCookie = (locale: string) => {
    const date = new Date();
    const expireMs = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years - i.e. effective no expiration
    date.setTime(date.getTime() + expireMs);
    document.cookie = `NEXT_LOCALE=${locale};expires=${date.toUTCString()};path=/`;
  };

  const changeLanguage = () => {
    track('Changed language', { from: lang, to: locale });
    replace(asPath, undefined, { locale, scroll: false });
    persistLocaleCookie(locale);
  };

  return (
    <Dropdown.Item
      style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'black', padding: '0.5rem' }}
      onSelect={changeLanguage}
    >
      <div>{getLanguageEmoji(locale)}</div>
      <div>{getLanguageNameNative(locale)}</div>
    </Dropdown.Item>
  );
};

export default ChangeLanguageButton;
