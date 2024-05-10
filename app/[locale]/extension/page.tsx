import Divider from 'components/common/Divider';
import DownloadButton from 'components/common/DownloadButton';
import Logo from 'components/common/Logo';
import { CHROME_EXTENSION_URL, FIREFOX_EXTENSION_URL } from 'lib/constants';
import type { Metadata, NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import ProseLayout from '../../layouts/ProseLayout';

interface Props {
  params: {
    locale: string;
  };
}

export const generateMetadata = async ({ params: { locale } }): Promise<Metadata> => {
  const t = await getTranslations({ locale });

  return {
    title: t('extension.meta.title'),
    description: t('extension.meta.description'),
  };
};

const ExtensionPage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);
  const t = useTranslations();

  return (
    <ProseLayout searchBar>
      <h1>{t('extension.title')}</h1>
      <Divider className="my-4" />

      <p>{t('extension.paragraph_1')}</p>

      <p>{t('extension.paragraph_2')}</p>

      <p className="mx-auto not-prose">
        <Image
          src="/assets/images/extension/screenshot-1.png"
          alt="Extension: Unexpected Allowance"
          height="800"
          width="1280"
          priority
          fetchPriority="high"
          className="w-full"
        />
      </p>

      <p>{t('extension.paragraph_3')}</p>

      <p>{t('extension.paragraph_4')}</p>

      <p className="mx-auto not-prose">
        <Image
          src="/assets/images/extension/screenshot-3.png"
          alt="Extension: Unexpected Listing"
          height="800"
          width="1280"
          className="w-full"
        />
      </p>

      <p>{t('extension.paragraph_5')}</p>

      <p>{t('extension.paragraph_6')}</p>

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
