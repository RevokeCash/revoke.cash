import Href from 'components/common/Href';
import { useMounted } from 'lib/hooks/useMounted';
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
  const isMounted = useMounted();

  const classes = twMerge(
    'text-lg font-bold',
    isMounted &&
      router.asPath.startsWith(path) &&
      'text-black visited:text-black dark:text-white dark:visited:text-white',
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
