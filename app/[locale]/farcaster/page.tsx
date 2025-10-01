import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import type { Metadata, NextPage } from 'next';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

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

const FarcasterPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  const FarcasterPageContent = (await import('components/farcaster/FarcasterPageContent')).default;

  return (
    <NextIntlClientProvider messages={{ common: messages.common, address: messages.address }}>
      <FarcasterPageContent />
    </NextIntlClientProvider>
  );
};

export default FarcasterPage;
