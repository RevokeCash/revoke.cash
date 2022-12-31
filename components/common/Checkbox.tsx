import { useColorTheme } from 'lib/hooks/useColorTheme';
import { classNames } from 'lib/utils/styles';
import Check from './Check';

interface Props {
  checked: boolean;
}

// Note: this is a controlled checkbox, so the checked prop must be passed in
const Checkbox = ({ checked }: Props) => {
  const { darkMode } = useColorTheme();

  const classes = classNames(
    'w-4 h-4 border border-black dark:border-white flex justify-center rounded items-center',
    darkMode && checked && 'bg-white text-black',
    !darkMode && checked && 'bg-black text-white'
  );

  return <div className={classes}>{checked && <Check />}</div>;
};

export default Checkbox;
