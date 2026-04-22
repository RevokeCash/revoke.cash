import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import type { ChangeEventHandler, FormEventHandler, HTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props extends Omit<HTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmit: FormEventHandler<HTMLFormElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  value: string;
  placeholder: string;
  children?: ReactNode;
  className?: string;
}

const SearchBox = ({ onSubmit, onChange, value, placeholder, children, className, ...props }: Props) => {
  const classes = twMerge(
    'h-9 flex gap-2 items-center border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 font-medium',
    'focus-within:border-black dark:focus-within:border-white',
    className,
  );

  return (
    <form onSubmit={onSubmit} className={classes}>
      <MagnifyingGlassIcon className="w-6 h-6 text-zinc-500 dark:text-zinc-300" />
      <input
        className="grow focus-visible:outline-hidden bg-transparent"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {children}
    </form>
  );
};

export default SearchBox;
