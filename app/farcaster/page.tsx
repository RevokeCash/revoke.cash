import FarcasterPageContent from 'components/farcaster/FarcasterPageContent';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations({ locale: 'en' });

  return {
    title: 'Revoke.cash - Token Approval Manager',
    description: t('common.meta.description', { chainName: 'Ethereum' }),
    other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: 'https://revoke.cash/assets/images/opengraph-image.jpg',
        button: {
          title: 'Open Revoke.cash',
          action: {
            type: 'launch_frame',
            name: 'Revoke.cash',
            url: 'https://revoke.cash/farcaster',
            splashBackgroundColor: '#000000',
            splashIconUrl: 'https://revoke.cash/assets/images/revoke-icon-orange-black.png',
          },
        },
      }),
    },
  };
};

const FarcasterPage = () => {
  setRequestLocale('en');
  return <FarcasterPageContent />;
};

export default FarcasterPage;
