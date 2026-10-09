import { ROUNDED_DOWN_NETWORK_COUNT } from '@revoke.cash/core/chains';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

interface Props {
  children: React.ReactNode;
}

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations({ locale: 'en' });

  return {
    metadataBase: new URL('https://revoke.cash'),
    title: {
      template: '%s | Revoke.cash',
      default: t('common.meta.title', { networkCount: ROUNDED_DOWN_NETWORK_COUNT }),
    },
    description: t('common.meta.description', { chainName: 'Ethereum', networkCount: ROUNDED_DOWN_NETWORK_COUNT }),
    applicationName: 'Revoke.cash',
    generator: 'Next.js',
  };
};

const RootLayout = ({ children }: Props) => {
  return <>{children}</>;
};

export default RootLayout;
