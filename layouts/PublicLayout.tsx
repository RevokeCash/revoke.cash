import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';

interface Props {
  children: React.ReactNode;
}

export const PublicLayout = ({ children }: Props) => {
  return (
    <div className="container-primary min-h-screen flex flex-col">
      <Header />

      <main className="py-2">{children}</main>

      <Footer />
    </div>
  );
};
