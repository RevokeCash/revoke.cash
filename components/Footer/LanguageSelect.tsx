import { track } from '@amplitude/analytics-browser';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import Select from 'react-select';

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
    <Select
      value={options.find((option) => option.value === lang)}
      options={options}
      onChange={selectLanguage}
      formatOptionLabel={displayOption}
      menuPlacement="top"
      isSearchable={false}
      styles={{
        menu: (styles) => ({
          ...styles,
          width: 110,
          minWidth: 110,
          margin: 0,
          // fontSize: '0.875rem',
          textAlign: 'left',
          zIndex: 3,
        }),
        menuList: (styles) => ({
          ...styles,
          padding: 0,
        }),
        dropdownIndicator: (styles) => ({
          ...styles,
          padding: 2,
        }),
        valueContainer: (styles) => ({
          ...styles,
          padding: 2,
        }),
        control: (styles) => ({
          ...styles,
          minHeight: 24,
          cursor: 'pointer',
        }),
        option: (styles) => ({
          ...styles,
          cursor: 'pointer',
          padding: '8px 8px',
          '&:first-child': {
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          },
          '&:last-child': {
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
          },
          // overflow: 'hidden',
          // backgroundColor: 'inherit'
        }),
      }}
      theme={(theme) => ({
        ...theme,
        borderRadius: 4,
        colors: {
          ...theme.colors,
          primary: 'black',
          primary25: '#ddd',
          neutral10: 'black',
          neutral20: 'black',
          neutral30: 'black',
          neutral40: 'black',
          neutral50: 'black',
          neutral60: 'black',
          neutral70: 'black',
          neutral80: 'black',
          neutral90: 'black',
        },
      })}
    />
  );
};

export default LanguageSelect;
