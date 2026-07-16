import { setRequestLocale } from 'next-intl/server';
import EmbedPageContent from '../components/EmbedPageContent';

const LedgerPage = () => {
  setRequestLocale('en');
  return <EmbedPageContent />;
};

export default LedgerPage;
