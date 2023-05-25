import Footer from 'components/footer/Footer';
import Header from 'components/header/Header';
import Sidebar from 'components/learn/Sidebar';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
}

const LearnLayout = ({ children, searchBar }: Props) => {
  return (
    <div className="flex flex-col mx-auto min-h-screen gap-4">
      <Header searchBar={searchBar} />
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8">
        <div className="flex flex-col min-w-0 lg:flex-row gap-4">
          <Sidebar />
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
