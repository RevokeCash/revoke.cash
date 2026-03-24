import ProseLayout from 'app/layouts/ProseLayout';
import Divider from 'components/common/Divider';
import DownloadButton from 'components/common/DownloadButton';
import Logo from 'components/common/Logo';
import { CHROME_EXTENSION_URL, FIREFOX_EXTENSION_URL } from 'lib/constants';
import type { Metadata, NextPage } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const dynamic = 'error';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;

  const t = await getTranslations({ locale });

  return {
    title: t('extension.meta.title'),
    description: t('extension.meta.description'),
  };
};

const ExtensionPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  return (
    <ProseLayout searchBar>
      <h1>{t('extension.title')}</h1>
      <Divider className="my-4" />

      <p>{t('extension.paragraph_1')}</p>

      <p>{t('extension.paragraph_2')}</p>

      <Image
        src="/assets/images/extension/screenshot-1.jpg"
        alt="Revoke Sidekick: Transaction Simulation"
        height="1000"
        width="1600"
        priority
        fetchPriority="high"
      />

      <p>{t('extension.paragraph_3')}</p>

      <Image
        src="/assets/images/extension/screenshot-2.jpg"
        alt="Revoke Sidekick: Protection Features"
        height="1000"
        width="1600"
      />

      <p>{t('extension.paragraph_4')}</p>

      <div className="flex flex-wrap items-center justify-center gap-4 not-prose">
        <DownloadButton href={CHROME_EXTENSION_URL}>
          <Logo src="/assets/images/vendor/chrome.svg" alt="Chrome Logo" className="rounded-none bg-transparent" />
          <Logo src="/assets/images/vendor/brave.svg" alt="Brave Logo" className="rounded-none bg-transparent" />
          <Logo src="/assets/images/vendor/edge.svg" alt="Edge Logo" className="rounded-none bg-transparent" />
        </DownloadButton>
        <DownloadButton href={FIREFOX_EXTENSION_URL}>
          <Logo src="/assets/images/vendor/firefox.svg" alt="Firefox Logo" className="rounded-none bg-transparent" />
        </DownloadButton>
      </div>
    </ProseLayout>
  );
};

export default ExtensionPage;
