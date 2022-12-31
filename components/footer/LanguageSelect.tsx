import { track } from '@amplitude/analytics-browser';
import Select from 'components/common/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';

const LanguageSelect = () => {
  const { asPath, replace } = useRouter();
  const { lang } = useTranslation();
  const { darkMode } = useColorTheme();

  const options = [
    { value: 'en', name: 'English', emoji: '🇬🇧' },
    { value: 'es', name: 'Español', emoji: '🇪🇸' },
    { value: 'zh', name: '中文', emoji: '🇨🇳' },
  ];

  const persistLocaleCookie = (locale: string) => {
    const date = new Date();
    const expireMs = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years - i.e. effective no expiration
    date.setTime(date.getTime() + expireMs);
    document.cookie = `NEXT_LOCALE=${locale};expires=${date.toUTCString()};path=/`;
  };

  const selectLanguage = (option: typeof options[number]) => {
    const locale = option.value;
    track('Changed language', { from: lang, to: locale });
    replace(asPath, undefined, { locale, scroll: false });
    persistLocaleCookie(locale);
  };

  const displayOption = (option: typeof options[number]) => `${option.emoji} ${option.name}`;

  return (
    <Select
      instanceId="language-select"
      className="w-30"
      controlTheme={darkMode ? 'light' : 'dark'}
      menuTheme={darkMode ? 'dark' : 'light'}
      value={options.find((option) => option.value === lang)}
      options={options}
      onChange={selectLanguage}
      formatOptionLabel={displayOption}
      menuPlacement="top"
      isSearchable={false}
      size="md"
    />
  );
};

export default LanguageSelect;
