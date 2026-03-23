import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg' | 'none';
}

const Input = ({ size, className, ...props }: Props) => {
  const classMapping = {
    common:
      'border border-zinc-300 dark:border-zinc-700 focus-visible:outline-hidden focus-visible:border-black dark:focus-visible:border-white bg-transparent',
    sm: 'h-6 px-2 text-xs rounded-md',
    md: 'h-9 px-3 text-base rounded-lg',
    lg: 'h-12 px-6 text-lg rounded-xl',
  };

  const classes = twMerge(classMapping.common, size && size !== 'none' && classMapping[size], className);

  return <input className={classes} {...props} />;
};

export default Input;
