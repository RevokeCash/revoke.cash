import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import EmbedPageContent from '../components/EmbedPageContent';

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations({ locale: 'en' });

  return {
    title: 'Revoke.cash',
    description: t('common.meta.description', { chainName: 'Ethereum' }),
  };
};

const WorldPage = () => {
  setRequestLocale('en');
  return <EmbedPageContent />;
};

export default WorldPage;
