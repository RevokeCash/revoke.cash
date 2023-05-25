import Href from 'components/common/Href';
import { useRouter } from 'next/router';
import { twMerge } from 'tailwind-merge';

interface Props {
  title: string;
  href: string;
  path?: string;
  children?: React.ReactNode;
}

const SidebarSection = ({ title, href, path, children }: Props) => {
  const router = useRouter();

  return (
    <li>
      <Href
        href={href}
        className={twMerge(
          'text-lg font-bold',
          router.asPath.startsWith(path) && 'text-black visited:text-black dark:text-white dark:visited:text-white'
        )}
        underline="none"
        router
        color="inherit"
      >
        {title}
      </Href>
      <ul className="flex flex-col pl-2 gap-1">{children}</ul>
    </li>
  );
};

export default SidebarSection;
