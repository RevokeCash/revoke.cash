'use client';

import Href from 'components/common/Href';
import { usePathname } from 'lib/i18n/navigation';
import { twMerge } from 'tailwind-merge';

interface Props {
  title: string;
  href: string;
}

const SidebarLink = ({ title, href }: Props) => {
  const path = usePathname();
  const isActive = path.startsWith(href);

  return (
    <li>
      <Href
        href={href}
        className={twMerge(
          'block rounded-md px-2 py-0.5 text-sm transition-colors',
          isActive
            ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-medium border-l-2 border-brand'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border-l-2 border-transparent',
        )}
        underline="none"
        router
      >
        {title}
      </Href>
    </li>
  );
};

export default SidebarLink;
