import Link from 'next/link';
import { AnchorHTMLAttributes, ForwardedRef, forwardRef, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
  className?: string;
  external?: boolean;
  router?: boolean;
  html?: boolean;
  underline?: 'always' | 'hover' | 'none';
}

const Href = (
  { href, children, external, className, router, underline, html, ...props }: Props,
  ref: ForwardedRef<HTMLAnchorElement>,
) => {
  const styleMapping = {
    html: 'text-blue-700 visited:text-fuchsia-800 dark:text-blue-400 dark:visited:text-fuchsia-600',
    inherit: 'text-current visited:text-current',
  };

  const underlineMapping = {
    always: 'underline hover:underline',
    hover: 'no-underline hover:underline',
    none: 'no-underline hover:no-underline',
  };

  const classes = twMerge(
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:rounded',
    styleMapping[html ? 'html' : 'inherit'],
    underlineMapping[underline ?? 'always'],
    className,
  );

  if (router) {
    return (
      <Link {...props} className={classes} href={href} ref={ref}>
        {children}
      </Link>
    );
  }

  return (
    <a
      {...props}
      className={classes}
      href={href}
      target={external ? '_blank' : undefined}
      ref={ref}
      referrerPolicy="origin"
    >
      {children}
    </a>
  );
};

export default forwardRef(Href);
