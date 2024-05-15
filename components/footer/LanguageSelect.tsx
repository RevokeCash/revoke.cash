'use client';

import Logo from 'components/common/Logo';
import Select from 'components/common/select/Select';
import { usePathname, useRouter } from 'lib/i18n/navigation';
import { track } from 'lib/utils/analytics';
import { useLocale } from 'next-intl';
import { FormatOptionLabelMeta } from 'react-select';

interface Option {
  value: string;
  name: string;
}

const LanguageSelect = () => {
  const router = useRouter();
  const path = usePathname();
  const locale = useLocale();

  const options: Option[] = [
    { value: 'en', name: 'English' },
    { value: 'zh', name: '中文' },
    { value: 'ru', name: 'Русский' },
    { value: 'ja', name: '日本語' },
    { value: 'es', name: 'Español' },
  ];

  const persistLocaleCookie = (locale: string) => {
    const date = new Date();
    const expireMs = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years - i.e. effective no expiration
    date.setTime(date.getTime() + expireMs);
    document.cookie = `NEXT_LOCALE=${locale};expires=${date.toUTCString()};path=/`;
  };

  const selectLanguage = (option: Option) => {
    const newLocale = option.value;
    track('Changed language', { from: locale, to: newLocale });
    router.replace(path, { locale: newLocale, scroll: false, showProgress: false });
    persistLocaleCookie(newLocale);
  };

  const displayOption = (option: Option, { context }: FormatOptionLabelMeta<Option>) => {
    // Flag images are from https://github.com/lipis/flag-icons/tree/main/flags/1x1
    const src = `/assets/images/flags/${option.value}.svg`;
    return (
      <div className="flex gap-1 items-center">
        <Logo src={src} alt={option.name} size={16} border className="border-white" />
        <div>{option.name}</div>
      </div>
    );
  };

  return (
    <Select
      instanceId="language-select"
      aria-label="Select Language"
      className="w-32"
      controlTheme="dark"
      menuTheme="dark"
      value={options.find((option) => option.value === locale)}
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
