import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useColorTheme } from '../../hooks/useColorTheme';

const ThemeToggle = () => {
  const { theme, setTheme } = useColorTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getIcon = () => {
    return theme === 'dark' ? MoonIcon : SunIcon;
  };

  const getTooltip = () => {
    return theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  };

  const IconComponent = getIcon();

  return (
    <button
      onClick={toggleTheme}
      title={getTooltip()}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 select-none"
      style={{
        minWidth: '40px',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    </button>
  );
};

export default ThemeToggle;
