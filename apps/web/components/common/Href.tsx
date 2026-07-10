'use client';

import { Link } from 'lib/i18n/navigation';
import analytics from 'lib/utils/analytics';
import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
  className?: string;
  external?: boolean;
  router?: boolean;
  html?: boolean;
  underline?: 'always' | 'hover' | 'none';
  unstyled?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

const Href = ({ href, children, external, className, router, underline, html, unstyled, ref, ...props }: Props) => {
  const styleMapping = {
    html: 'text-amber-700 dark:text-brand',
    inherit: 'text-current visited:text-current',
  };

  const underlineMapping = {
    always: 'underline hover:underline decoration-brand',
    hover: 'no-underline hover:underline decoration-brand',
    none: 'no-underline hover:no-underline',
  };

  const classes = twMerge(
    'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-current focus-visible:rounded-sm',
    styleMapping[html ? 'html' : 'inherit'],
    underlineMapping[underline ?? 'always'],
    className,
  );

  if (router) {
    return (
      <Link {...props} className={unstyled ? className : classes} href={href} ref={ref} popover={undefined}>
        {children}
      </Link>
    );
  }

  return (
    <a
      {...props}
      className={unstyled ? className : classes}
      href={href}
      target={external ? '_blank' : undefined}
      ref={ref}
      referrerPolicy="origin"
      onClick={(e) => {
        if (props.onClick) props.onClick(e);
        analytics.track('Link Clicked', { href });
      }}
    >
      {children}
    </a>
  );
};

export default Href;
