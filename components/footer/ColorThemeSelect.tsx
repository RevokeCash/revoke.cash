import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import Select from 'components/common/Select';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import useTranslation from 'next-translate/useTranslation';

const ColorThemeSelect = () => {
  const { darkMode, theme, setTheme } = useColorTheme();
  const { t } = useTranslation();

  const options = [
    { value: 'system', icon: <ComputerDesktopIcon className="w-4 h-4" /> },
    { value: 'dark', icon: <MoonIcon className="w-4 h-4" /> },
    { value: 'light', icon: <SunIcon className="w-4 h-4" /> },
  ] as const;

  const selectTheme = (option: typeof options[number]) => setTheme(option.value);

  const displayOption = (option: typeof options[number]) => (
    <div className="flex gap-1 items-center" suppressHydrationWarning>
      {option.icon} {t(`common:color_themes.${option.value}`)}
    </div>
  );

  return (
    <Select
      instanceId="color-theme-select"
      className="w-30"
      controlTheme={darkMode ? 'light' : 'dark'}
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
