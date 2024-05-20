'use client';

import Href from 'components/common/Href';
import { useMounted } from 'lib/hooks/useMounted';
import { usePathname } from 'lib/i18n/navigation';
import { twMerge } from 'tailwind-merge';

interface Props {
  title: string;
  href: string;
  path?: string;
  children?: React.ReactNode;
}

const SidebarSection = ({ title, href, path, children }: Props) => {
  const routerPath = usePathname();
  const isMounted = useMounted();

  const classes = twMerge(
    'text-lg font-bold',
    isMounted && routerPath.startsWith(path) && 'text-black visited:text-black dark:text-white dark:visited:text-white',
  );

  return (
    <li>
      <Href href={href} className={classes} underline="none" router color="inherit">
        {title}
      </Href>
      {children && <ul className="flex flex-col pl-2 gap-1">{children}</ul>}
    </li>
  );
};

export default SidebarSection;
