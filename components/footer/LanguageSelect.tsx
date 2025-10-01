'use client';

import Logo from 'components/common/Logo';
import Select from 'components/common/select/Select';
import type { Locale } from 'lib/i18n/config';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { usePathname } from 'lib/i18n/navigation';
import analytics from 'lib/utils/analytics';
import { useLocale } from 'next-intl';

interface Option {
  value: Locale;
  name: string;
}

const LanguageSelect = () => {
  const router = useCsrRouter();
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
    const expireMs = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years - i.e. effective no expiration
    cookieStore.set({ name: 'NEXT_LOCALE', value: locale, expires: Date.now() + expireMs, path: '/' });
  };

  const selectLanguage = (option: Option) => {
    const newLocale = option.value;
    analytics.track('Changed language', { from: locale, to: newLocale });
    router.replace(path, { locale: newLocale, scroll: false, showProgress: false, retainSearchParams: ['chainId'] });
    persistLocaleCookie(newLocale);
  };

  const displayOption = (option: Option) => {
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
      theme="dark"
      value={options.find((option) => option.value === locale)}
      options={options}
      onChange={(option) => selectLanguage(option!)}
      formatOptionLabel={displayOption}
      menuPlacement="top"
      isSearchable={false}
      isMulti={false}
    />
  );
};

export default LanguageSelect;
