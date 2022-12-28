import { classNames } from 'lib/utils/styles';
import Link from 'next/link';
import { MouseEventHandler } from 'react';
import Spinner from './Spinner';

interface Props {
  disabled?: boolean;
  style: 'primary' | 'secondary' | 'tertiary' | 'none';
  size: 'sm' | 'md' | 'lg' | 'none';
  onClick?: MouseEventHandler;
  href?: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  router?: boolean;
  loading?: boolean;
  asDiv?: boolean;
  align?: 'left' | 'center' | 'right';
}

// TODO: Focus modifier for primary buttons
const Button = ({
  disabled,
  style,
  size,
  onClick,
  href,
  external,
  router,
  children,
  className,
  loading,
  asDiv,
  align,
}: Props) => {
  const classMapping = {
    common:
      'flex items-center border border-black duration-150 cursor-pointer disabled:cursor-not-allowed leading-none font-medium',
    primary: 'bg-black text-white visited:text-white hover:bg-gray-800 disabled:bg-gray-600',
    secondary: 'bg-white text-black visited:text-black hover:bg-gray-200 disabled:bg-gray-300',
    tertiary: 'text-black disabled:text-gray-600 border-none',
    sm: 'h-6 px-2 text-xs rounded-md',
    md: 'h-9 px-4 text-base rounded-lg',
    lg: 'h-12 px-6 text-lg rounded-xl',
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const classes = classNames(
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black',
    (style === 'none' || style === 'tertiary') && 'focus-visible:ring-2 focus-visible:rounded',
    style !== 'none' && classMapping.common,
    classMapping[style],
    classMapping[align ?? 'center'],
    size !== 'none' && classMapping[size],
    loading && 'flex gap-1', // TODO: Make this more robust when needed
    className
  );

  // Note: This code is repeated in Href.tsx for styling reasons
  if (href) {
    const hrefComponent = (
      <a className={classes} href={href} target={external ? '_blank' : undefined}>
        {children}
      </a>
    );

    if (router) {
      return <Link href={href}>{hrefComponent}</Link>;
    }
  }

  if (asDiv) {
    return (
      <div className={classes} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <button disabled={disabled || loading} onClick={onClick} className={classes}>
      {children}
      {loading && <Spinner />}
    </button>
  );
};

export default Button;
