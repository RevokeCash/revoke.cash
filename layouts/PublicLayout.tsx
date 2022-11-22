import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';

interface Props {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 min-h-screen">
      <Header />
      <main>{children}</main>
      <div className="flex flex-col justify-end grow">
        <Footer />
      </div>
    </div>
  );
};

export default PublicLayout;
