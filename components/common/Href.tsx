import { classNames } from 'lib/utils/styles';
import Link from 'next/link';
import { ForwardedRef, forwardRef, ReactNode } from 'react';

interface Props {
  href: string;
  children?: ReactNode;
  className?: string;
  external?: boolean;
  router?: boolean;
  style: 'html' | 'black' | 'none';
  underline?: 'always' | 'hover' | 'none';
}

const Href = (
  { href, children, external, className, router, style, underline }: Props,
  ref: ForwardedRef<HTMLAnchorElement>
) => {
  const classMapping = {
    html: 'text-blue-700 visited:text-fuchsia-800',
    black: 'underline text-black visited:text-black',
  };

  const undelineMapping = {
    always: 'underline hover:underline',
    hover: 'no-underline hover:underline',
    none: 'no-underline hover:no-underline',
  };

  const classes = classNames(className, classMapping[style], undelineMapping[underline ?? 'always']);

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
