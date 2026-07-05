import { setRequestLocale } from 'next-intl/server';
import EmbedPageContent from '../components/EmbedPageContent';

const SafePage = () => {
  setRequestLocale('en');
  return <EmbedPageContent />;
};

export default SafePage;
