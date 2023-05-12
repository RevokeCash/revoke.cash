import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { ChangeEventHandler, FormEventHandler, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  onSubmit: FormEventHandler<HTMLFormElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  value: string;
  placeholder: string;
  children?: ReactNode;
  className?: string;
}

const SearchBox = ({ onSubmit, onChange, value, placeholder, children, className }: Props) => {
  const classes = twMerge(
    'h-9 flex gap-2 items-center border border-black dark:border-white rounded-lg px-2 font-medium',
    'focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-white',
    className
  );

  return (
    <form onSubmit={onSubmit} className={classes}>
      <MagnifyingGlassIcon className="w-6 h-6" />
      <input
        className="grow focus-visible:outline-none bg-transparent"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {children}
    </form>
  );
};

export default SearchBox;
