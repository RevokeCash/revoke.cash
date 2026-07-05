import { setRequestLocale } from 'next-intl/server';
import EmbedPageContent from '../components/EmbedPageContent';

const WorldPage = () => {
  setRequestLocale('en');
  return <EmbedPageContent />;
};

export default WorldPage;
