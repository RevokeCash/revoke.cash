import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations({ locale: 'en' });

  return {
    metadataBase: new URL('https://revoke.cash'),
    title: {
      template: '%s | Revoke.cash',
      default: t('common.meta.title'),
    },
    description: t('common.meta.description', { chainName: 'Ethereum' }),
    applicationName: 'Revoke.cash',
    generator: 'Next.js',
  };
};

const RootLayout = ({ children }) => {
  return <>{children}</>;
};

export default RootLayout;
