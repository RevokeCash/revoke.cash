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

  return (
    <li>
      <Href
        href={href}
        className={twMerge(
          path.startsWith(href) && 'text-black visited:text-black dark:text-white dark:visited:text-white',
        )}
        underline="hover"
        router
      >
        {title}
      </Href>
    </li>
  );
};

export default SidebarLink;
