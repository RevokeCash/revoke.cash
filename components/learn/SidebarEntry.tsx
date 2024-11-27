import type { ISidebarEntry } from 'lib/interfaces';
import SidebarLink from './SidebarLink';
import SidebarSection from './SidebarSection';

interface Props {
  title: string;
  path: string;
  children?: ISidebarEntry[];
}

const SidebarEntry = ({ title, path, children }: Props) => {
  if (children) {
    return (
      <SidebarSection title={title} path={path} href={path}>
        {children?.map((child) => (
          <SidebarEntry key={child.path} {...child} />
        ))}
      </SidebarSection>
    );
  }

  return <SidebarLink title={title} href={path} />;
};

export default SidebarEntry;
