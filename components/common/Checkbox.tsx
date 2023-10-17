import { useColorTheme } from 'lib/hooks/useColorTheme';
import { twMerge } from 'tailwind-merge';
import Check from './Check';

interface Props {
  checked: boolean;
}

// Note: this is a controlled checkbox, so the checked prop must be passed in
const Checkbox = ({ checked }: Props) => {
  const { darkMode } = useColorTheme();

  const classes = twMerge(
    'w-4 h-4 border border-black dark:border-white flex justify-center rounded items-center',
    darkMode && checked && 'bg-white text-black',
    !darkMode && checked && 'bg-black text-white',
  );

  return <div className={classes}>{checked && <Check />}</div>;
};

export default Checkbox;
