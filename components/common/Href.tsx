import { classNames } from 'lib/utils/styles';
import Link from 'next/link';
import { ForwardedRef, forwardRef, ReactNode } from 'react';

interface Props {
  href: string;
  children?: ReactNode;
  className?: string;
  external?: boolean;
  router?: boolean;
  html?: boolean;
  underline?: 'always' | 'hover' | 'none';
}

const Href = (
  { href, children, external, className, router, underline, html }: Props,
  ref: ForwardedRef<HTMLAnchorElement>
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

  const classes = classNames(
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:rounded',
    className,
    styleMapping[html ? 'html' : 'inherit'],
    underlineMapping[underline ?? 'always']
  );

  const hrefComponent = (
    <a className={classes} href={href} target={external ? '_blank' : undefined} ref={ref}>
      {children}
    </a>
  );

  if (router) {
    return <Link href={href}>{hrefComponent}</Link>;
  }

  return hrefComponent;
};

export default forwardRef(Href);
