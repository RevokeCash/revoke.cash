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
  const isActive = isMounted && path && routerPath === path;

  return (
    <li className="flex flex-col">
      <Href
        href={href}
        className={twMerge(
          'block text-sm font-semibold uppercase tracking-wide px-2 py-1 rounded-md transition-colors',
          isActive
            ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
            : 'text-zinc-500 dark:text-zinc-500 hover:text-black dark:hover:text-white',
        )}
        underline="none"
        router
        color="inherit"
      >
        {title}
      </Href>
      {children && <ul className="flex flex-col pl-2 w-full">{children}</ul>}
    </li>
  );
};

export default SidebarSection;
