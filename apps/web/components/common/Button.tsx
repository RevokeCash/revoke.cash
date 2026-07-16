'use client';

import { CsrLink } from 'lib/i18n/csr-navigation';
import { Link } from 'lib/i18n/navigation';
import analytics from 'lib/utils/analytics';
import type { MouseEventHandler, Ref } from 'react';
import { twMerge } from 'tailwind-merge';
import Href from './Href';
import Spinner from './Spinner';

// TODO: Proper extended styles for this component
export interface Props extends Record<string, any> {
  disabled?: boolean;
  style: 'primary' | 'secondary' | 'tertiary' | 'none';
  size: 'sm' | 'md' | 'lg' | 'none' | 'menu';
  onClick?: MouseEventHandler;
  href?: string;
  children?: React.ReactNode;
  className?: string;
  external?: boolean;
  router?: boolean;
  loading?: boolean;
  asDiv?: boolean;
  align?: 'left' | 'center' | 'right';
  retainSearchParams?: boolean | string[];
  focusRing?: boolean;
  ref?: Ref<any>;
}

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
  retainSearchParams,
  focusRing = true,
  ref,
  ...props
}: Props) => {
  const classMapping = {
    common:
      'flex items-center border border-zinc-300 dark:border-zinc-700 duration-150 cursor-pointer disabled:cursor-not-allowed leading-none font-medium shrink-0 whitespace-nowrap',
    primary:
      'bg-black text-white visited:text-white hover:bg-zinc-800 disabled:bg-zinc-600 dark:bg-white dark:text-black dark:visited:text-black dark:hover:bg-zinc-200 dark:disabled:bg-zinc-300',
    secondary:
      'bg-white text-black visited:text-black hover:bg-zinc-200 disabled:bg-zinc-300 dark:bg-black dark:text-white dark:visited:text-white dark:hover:bg-zinc-800 dark:disabled:bg-zinc-600',
    tertiary:
      'text-black visited:text-black dark:text-white dark:visited:text-white disabled:text-zinc-600 dark:disabled:text-zinc-400 border-none',
    menu: 'h-9 px-4 rounded-none border-none font-normal text-base justify-start',
    sm: 'h-6 px-2 text-xs rounded-md',
    md: 'h-9 px-4 text-base rounded-lg',
    lg: 'h-12 px-6 text-lg rounded-xl',
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const classes = twMerge(
    'focus-visible:outline-hidden',
    focusRing && style === 'primary' && 'focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white',
    focusRing && style === 'secondary' && 'focus-visible:border-black dark:focus-visible:border-white',
    focusRing &&
      (style === 'none' || style === 'tertiary') &&
      'focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-current focus-visible:rounded-sm',
    style !== 'none' && classMapping.common,
    style !== 'none' && classMapping[style],
    classMapping[align ?? 'center'],
    size !== 'none' && classMapping[size],
    loading && 'flex gap-1',
    className,
  );

  // Note: This code is repeated in Href.tsx for styling reasons
  if (href) {
    if (router) {
      const trackedOnClick: MouseEventHandler = (event) => {
        if (onClick) onClick(event);
        analytics.track('Link Clicked', { href });
      };

      if (retainSearchParams) {
        return (
          <CsrLink
            {...props}
            className={classes}
            href={href}
            ref={ref}
            retainSearchParams={retainSearchParams}
            onClick={trackedOnClick}
          >
            {children}
          </CsrLink>
        );
      }

      return (
        <Link {...props} className={classes} href={href} ref={ref} onClick={trackedOnClick}>
          {children}
        </Link>
      );
    }

    return (
      <Href {...props} unstyled className={classes} href={href} external={external} router={router} onClick={onClick}>
        {children}
      </Href>
    );
  }

  if (asDiv) {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: we know this is a hack, it is what it is
      // biome-ignore lint/a11y/noStaticElementInteractions: we know this is a hack, it is what it is
      <div {...props} className={classes} onClick={onClick} ref={ref}>
        {children}
      </div>
    );
  }

  return (
    <button {...props} disabled={disabled || loading} onClick={onClick} className={classes} ref={ref}>
      {children}
      {loading && <Spinner className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
    </button>
  );
};

export default Button;
