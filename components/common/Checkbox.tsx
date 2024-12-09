import { twMerge } from 'tailwind-merge';
import Check from './icons/Check';
import Minus from './icons/Minus';

interface Props {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
  iconClassName?: string;
}

// Note: this is a controlled checkbox, so the checked prop must be passed in
const Checkbox = ({ checked, indeterminate, disabled, onChange, className, iconClassName }: Props) => {
  const iconClasses = twMerge('w-4 h-4', iconClassName);

  const classes = twMerge(
    'border border-black dark:border-white flex justify-center rounded items-center cursor-pointer focus:outline-black dark:focus:outline-white',
    iconClasses,
    className,
    (checked || indeterminate) && 'bg-brand text-black border-0',
    disabled && 'cursor-not-allowed bg-zinc-300 dark:bg-zinc-500 border-0',
  );

  const icon = disabled ? null : checked ? (
    <Check className={iconClasses} />
  ) : indeterminate ? (
    <Minus className={iconClasses} />
  ) : null;

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: we want to use a div instead of a native checkbox for styling reasons
      role="checkbox"
      aria-checked={checked}
      className={classes}
      onClick={(event) => !disabled && onChange?.(event)}
      onKeyDown={(event) => !disabled && event.key === 'Enter' && onChange?.(event)}
      tabIndex={0}
    >
      {icon}
    </div>
  );
};

export default Checkbox;
