import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import Select from 'components/common/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useMounted } from 'lib/hooks/useMounted';
import { track } from 'lib/utils/analytics';
import useTranslation from 'next-translate/useTranslation';

const ColorThemeSelect = () => {
  const isMounted = useMounted();
  const { darkMode, theme, setTheme } = useColorTheme();
  const { t } = useTranslation();

  const options = [
    { value: 'system', icon: <ComputerDesktopIcon className="w-4 h-4" /> },
    { value: 'dark', icon: <MoonIcon className="w-4 h-4" /> },
    { value: 'light', icon: <SunIcon className="w-4 h-4" /> },
  ] as const;

  const selectTheme = (option: (typeof options)[number]) => {
    track('Changed Color Theme', { theme: option.value });
    setTheme(option.value);
  };

  const displayOption = (option: (typeof options)[number]) =>
    isMounted && (
      <div className="flex gap-1 items-center" suppressHydrationWarning>
        {option.icon} {t(`common:color_themes.${option.value}`)}
      </div>
    );

  return (
    <Select
      instanceId="color-theme-select"
      aria-label="Select Color Theme"
      className="w-30"
      controlTheme="dark"
      menuTheme={darkMode ? 'dark' : 'light'}
      value={options.find((option) => option.value === theme)}
      options={options}
      onChange={selectTheme}
      formatOptionLabel={displayOption}
      menuPlacement="top"
      isSearchable={false}
    />
  );
};

export default ColorThemeSelect;
