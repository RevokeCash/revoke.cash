import { track } from '@amplitude/analytics-browser';
import StyledSelect from 'components/common/StyledSelect';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';

const LanguageSelect = () => {
  const { asPath, replace } = useRouter();
  const { lang } = useTranslation();

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

  const displayOption = (option: any, { context }: any) =>
    context === 'menu' ? `${option.emoji} ${option.name}` : option.emoji;

  return (
    <StyledSelect
      value={options.find((option) => option.value === lang)}
      options={options}
      onChange={selectLanguage}
      formatOptionLabel={displayOption}
      menuPlacement="top"
      isSearchable={false}
    />
  );
};

export default LanguageSelect;
