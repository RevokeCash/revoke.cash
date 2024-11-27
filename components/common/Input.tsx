import { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg' | 'none';
}

const Input = ({ size, className, ...props }: Props) => {
  const classMapping = {
    common:
      'border border-black dark:border-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white bg-transparent',
    sm: 'h-6 px-2 text-xs rounded-md',
    md: 'h-9 px-3 text-base rounded-lg',
    lg: 'h-12 px-6 text-lg rounded-xl',
  };

  const classes = twMerge(classMapping.common, size !== 'none' && classMapping[size], className);

  return <input className={classes} {...props} />;
};

export default Input;
