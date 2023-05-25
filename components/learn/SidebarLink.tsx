import Href from 'components/common/Href';
import { useRouter } from 'next/router';
import { twMerge } from 'tailwind-merge';

interface Props {
  title: string;
  href: string;
}

const SidebarLink = ({ title, href }: Props) => {
  const router = useRouter();

  return (
    <li>
      <Href
        href={href}
        className={twMerge(
          router.asPath.startsWith(href) && 'text-black visited:text-black dark:text-white dark:visited:text-white'
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
