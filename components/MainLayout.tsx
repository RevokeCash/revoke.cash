import Footer from './Footer/Footer';
import Header from './Header/Header';

interface Props {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: Props) => {
  return (
    <div className="dev container-primary min-h-screen flex flex-col duration-300">
      <Header />

      <main>{children}</main>

      <Footer />
    </div>
  );
};
