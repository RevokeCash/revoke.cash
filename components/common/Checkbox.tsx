import { twMerge } from 'tailwind-merge';
import Check from './icons/Check';
import Minus from './icons/Minus';

interface Props {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  iconClassName?: string;
}

// Note: this is a controlled checkbox, so the checked prop must be passed in
const Checkbox = ({ checked, indeterminate, disabled, onChange, className, iconClassName }: Props) => {
  const iconClasses = twMerge('w-4 h-4', iconClassName);

  const classes = twMerge(
    'border border-black dark:border-white flex justify-center rounded items-center cursor-pointer',
    iconClasses,
    className,
    (checked || indeterminate) && 'bg-brand text-black border-0',
    disabled && 'cursor-not-allowed bg-zinc-300 dark:bg-zinc-500 border-0',
  );

  const icon = checked ? <Check className={iconClasses} /> : indeterminate ? <Minus className={iconClasses} /> : null;

  return (
    <div className={classes} onClick={(event) => !disabled && onChange?.(event)}>
      {icon}
    </div>
  );
};

export default Checkbox;
