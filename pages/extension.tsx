import Divider from 'components/common/Divider';
import DownloadButton from 'components/common/DownloadButton';
import Logo from 'components/common/Logo';
import ProseLayout from 'layouts/ProseLayout';
import { CHROME_EXTENSION_URL, FIREFOX_EXTENSION_URL } from 'lib/constants';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';

const ExtensionPage: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={t('extension:meta.title')}
        description={t('extension:meta.description')}
        openGraph={{
          url: 'https://revoke.cash/extension',
          images: [
            {
              url: 'https://revoke.cash/assets/images/extension/card.png',
              width: 1600,
              height: 900,
            },
          ],
          site_name: 'Revoke.cash',
          type: 'website',
        }}
      />
      <ProseLayout>
        <h1>{t('extension:title')}</h1>
        <Divider className="my-4" />

        <p>
          <Trans i18nKey="extension:paragraph_1" />
        </p>

        <p>
          <Trans i18nKey="extension:paragraph_2" />
        </p>

        <p className="mx-auto not-prose">
          <Image
            src="/assets/images/extension/screenshot-1.png"
            alt="Extension: Unexpected Allowance"
            height="500"
            width="800"
            priority
            fetchPriority="high"
          />
        </p>

        <p>
          <Trans i18nKey="extension:paragraph_3" />
        </p>

        <p>
          <Trans i18nKey="extension:paragraph_4" />
        </p>

        <p className="mx-auto not-prose">
          <Image
            src="/assets/images/extension/screenshot-3.png"
            alt="Extension: Unexpected Listing"
            height="500"
            width="800"
          />
        </p>

        <p>
          <Trans i18nKey="extension:paragraph_5" />
        </p>

        <p>
          <Trans i18nKey="extension:paragraph_6" />
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 not-prose">
          <DownloadButton href={CHROME_EXTENSION_URL}>
            <Logo src="/assets/images/vendor/chrome.svg" alt="Chrome Logo" className="rounded-none bg-transparent" />
            <Logo src="/assets/images/vendor/brave.svg" alt="Brave Logo" className="rounded-none bg-transparent" />
            <Logo src="/assets/images/vendor/edge.svg" alt="Edge Logo" className="rounded-none bg-transparent" />
          </DownloadButton>
          <DownloadButton href={FIREFOX_EXTENSION_URL}>
            <Logo src="/assets/images/vendor/firefox.svg" alt="Firefox Logo" className="rounded-none bg-transparent" />
          </DownloadButton>
        </div>
        {/* </div> */}
      </ProseLayout>
    </>
  );
};

export default ExtensionPage;
