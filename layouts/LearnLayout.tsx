import Footer from 'components/footer/Footer';
import Header from 'components/header/Header';
import Sidebar from 'components/learn/Sidebar';
import { ISidebarEntry } from 'lib/interfaces';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
  sidebarEntries: ISidebarEntry[];
}

const LearnLayout = ({ children, searchBar, sidebarEntries }: Props) => {
  return (
    <div className="flex flex-col mx-auto min-h-screen gap-4">
      <Header searchBar={searchBar} />
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8">
        <div className="flex flex-col min-w-0 lg:flex-row gap-4">
          <Sidebar entries={sidebarEntries} />
          <div className="min-w-0 w-full">{children}</div>
        </div>
      </main>
      <div className="flex flex-col justify-end grow">
        <Footer />
      </div>
    </div>
  );
};

export default LearnLayout;
