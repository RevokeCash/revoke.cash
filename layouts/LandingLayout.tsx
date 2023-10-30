import Footer from 'components/footer/Footer';
import Header from 'components/header/Header';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
}

const LandingLayout = ({ children, searchBar }: Props) => {
  return (
    <div className="flex flex-col mx-auto min-h-screen">
      <Header searchBar={searchBar} />
      <main className="w-full">{children}</main>
      <div className="flex flex-col justify-end grow">
        <Footer />
      </div>
    </div>
  );
};

export default LandingLayout;
