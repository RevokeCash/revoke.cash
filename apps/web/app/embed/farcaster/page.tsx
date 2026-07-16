import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import EmbedPageContent from '../components/EmbedPageContent';

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    other: {
      'fc:miniapp': JSON.stringify({
        version: '1',
        imageUrl: 'https://revoke.cash/assets/images/opengraph-image.jpg',
        button: {
          title: 'Check Your Approvals',
          action: {
            type: 'launch_frame',
            name: 'Revoke.cash',
            url: 'https://revoke.cash/embed/farcaster',
            splashBackgroundColor: '#ffffff',
            splashImageUrl: 'https://revoke.cash/assets/images/splash-image-farcaster.png',
          },
        },
      }),
    },
  };
};

const FarcasterPage = () => {
  setRequestLocale('en');
  return <EmbedPageContent />;
};

export default FarcasterPage;
