import { ISidebarEntry } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';
import StickyBox from 'react-sticky-box';
import SidebarEntry from './SidebarEntry';
import SidebarSection from './SidebarSection';

interface Props {
  entries: ISidebarEntry[];
}

const Sidebar = ({ entries }: Props) => {
  const { t } = useTranslation();

  return (
    <aside>
      <StickyBox offsetTop={16} offsetBottom={16}>
        <ul className="border border-black dark:border-white rounded-lg bg-white dark:bg-black w-full lg:w-80 px-4 py-2 flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
          {entries.map((entry) => (
            <SidebarEntry key={entry.path} {...entry} />
          ))}
          <SidebarSection title={t('learn:sidebar.faq')} path="/learn/faq" href="/learn/faq" />
        </ul>
      </StickyBox>
    </aside>
  );
};

export default Sidebar;
