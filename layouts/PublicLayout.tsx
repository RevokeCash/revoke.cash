import Footer from 'components/footer/Footer';
import Header from 'components/header/Header';

interface Props {
  children: React.ReactNode;

  searchBar?: boolean;
}

const PublicLayout = ({ children, searchBar = true }: Props) => {
  return (
    <div className="flex flex-col mx-auto min-h-screen gap-4">
      <Header searchBar={searchBar} />
      <main className="max-w-7xl w-full mx-auto px-4 md:px-8">{children}</main>
      <div className="flex flex-col justify-end grow">
        <Footer />
      </div>
    </div>
  );
};

export default PublicLayout;
