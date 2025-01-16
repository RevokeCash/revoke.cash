'use client';

import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import Select from 'components/common/select/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useMounted } from 'lib/hooks/useMounted';
import analytics from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';

const ColorThemeSelect = () => {
  const isMounted = useMounted();
  const { theme, setTheme } = useColorTheme();
  const t = useTranslations();

  const options = [
    { value: 'system', icon: ComputerDesktopIcon },
    { value: 'dark', icon: MoonIcon },
    { value: 'light', icon: SunIcon },
  ] as const;

  const selectTheme = (option: (typeof options)[number]) => {
    analytics.track('Changed Color Theme', { theme: option.value });
    setTheme(option.value);
  };

  const displayOption = (option: (typeof options)[number]) =>
    isMounted && (
      <div className="flex gap-1 items-center" suppressHydrationWarning>
        <option.icon className="w-4 h-4 shrink-0" /> {t(`common.color_themes.${option.value}`)}
      </div>
    );

  return (
    <Select
      instanceId="color-theme-select"
      aria-label="Select Color Theme"
      className="w-32"
      theme="dark"
      value={options.find((option) => option.value === theme)}
      options={options}
      onChange={(option) => selectTheme(option!)}
      formatOptionLabel={displayOption}
      menuPlacement="top"
      isSearchable={false}
      isMulti={false}
    />
  );
};

export default ColorThemeSelect;
