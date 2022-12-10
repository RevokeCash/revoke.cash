import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';

interface Props {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col mx-auto px-8 py-4 min-h-screen gap-4">
      <Header />
      <main>{children}</main>
      <div className="flex flex-col justify-end grow">
        <Footer />
      </div>
    </div>
  );
};

export default PublicLayout;
