import Breadcrumb from 'components/common/Breadcrumb';
import Footer from 'components/footer/Footer';
import Header from 'components/header/Header';
import Sidebar from 'components/learn/Sidebar';
import { ISidebarEntry } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
  sidebarEntries: ISidebarEntry[];
  slug: string[];
  title: string;
}

const LearnLayout = ({ children, searchBar, sidebarEntries, slug, title }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col mx-auto min-h-screen gap-4">
      <Header searchBar={searchBar} />
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8">
        <div className="flex flex-col min-w-0 lg:flex-row gap-4">
          <Sidebar entries={sidebarEntries} />
          <div className="min-w-0 w-full">
            <div className="pl-2 pt-2">
              <Breadcrumb
                pages={[
                  { name: t('common:nav.learn') },
                  ...slug.slice(0, slug.length - 1).map((slug) => ({ name: t(`learn:sidebar.${slug}`) })),
                  { name: title },
                ]}
              />
            </div>
            {children}
          </div>
        </div>
      </main>
      <div className="flex flex-col justify-end grow mt-8">
        <Footer />
      </div>
    </div>
  );
};

export default LearnLayout;
