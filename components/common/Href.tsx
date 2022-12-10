import { classNames } from 'lib/utils/styles';
import Link from 'next/link';
import { ReactNode } from 'react';

interface Props {
  href: string;
  children?: ReactNode;
  className?: string;
  external?: boolean;
  router?: boolean;
  style: 'html' | 'black' | 'none';
}

const Href = ({ href, children, external, className, router, style }: Props) => {
  const classMapping = {
    html: 'text-blue-700 visited:text-fuchsia-800 no-underline hover:underline',
    black: 'underline text-black visited:text-black',
  };

  const classes = classNames(className, classMapping[style]);

  const hrefComponent = (
    <a className={classes} href={href} target={external ? '_blank' : undefined}>
      {children}
    </a>
  );

  if (router) {
    return <Link href={href}>{hrefComponent}</Link>;
  }

  return hrefComponent;
};

export default Href;
